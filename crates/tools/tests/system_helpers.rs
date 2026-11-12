//! System helpers (#452): discovery, precedence and updates, with a PATH private to a child.

#[cfg(windows)]
fn main() {
    println!("system_helpers: Unix-only system discovery");
}

#[cfg(unix)]
fn main() {
    use std::os::unix::fs::{PermissionsExt, symlink};
    use std::path::Path;
    use std::process::Command;

    const ROOT: &str = "TDM_TEST_SYSTEM_HELPERS";
    if let Some(root) = std::env::var_os(ROOT) {
        check(Path::new(&root));
        println!("system_helpers: ok");
        return;
    }

    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    for name in ["broken", "not-executable", "bin", "package"] {
        std::fs::create_dir(root.join(name)).unwrap();
    }
    for (name, answer) in [
        ("yt-dlp", "2026.10.26"),
        ("ffmpeg", "ffmpeg version 8.0"),
        ("gallery-dl", "1.26.9"),
    ] {
        let program = root.join("package").join(name);
        std::fs::write(&program, format!("#!/bin/sh\nprintf '%s\\n' '{answer}'\n")).unwrap();
        std::fs::set_permissions(&program, std::fs::Permissions::from_mode(0o755)).unwrap();
        symlink(&program, root.join("bin").join(name)).unwrap();
        symlink(root.join("missing"), root.join("broken").join(name)).unwrap();
        std::fs::write(root.join("not-executable").join(name), b"not a program").unwrap();
    }
    let path =
        std::env::join_paths(["broken", "not-executable", "bin"].map(|n| root.join(n))).unwrap();
    let status = Command::new(std::env::current_exe().unwrap())
        .env(ROOT, root)
        .env("PATH", path)
        .status()
        .unwrap();
    assert!(status.success(), "system-helper checks failed");
}

#[cfg(unix)]
fn check(root: &std::path::Path) {
    use tdm_tools::{Installed, chosen::Helper};

    let dir = root.join("data");
    let system = Installed {
        version: "system".into(),
        exe: root.join("bin/yt-dlp"),
    };
    assert_eq!(
        tdm_tools::installed(&dir),
        Some(system.clone()),
        "find the executable, including a package-manager symlink"
    );
    assert_eq!(
        tdm_tools::ffmpeg::installed(&dir).unwrap().exe,
        root.join("bin/ffmpeg")
    );

    // The background refresh leaves the system's copy alone, and asks nothing to say so. Only an
    // explicit install goes to the network: a down adapter refuses network setup, so a regression
    // cannot contact a real release server.
    let rt = tokio::runtime::Runtime::new().unwrap();
    let net = tdm_engine::Options {
        route: tdm_engine::Route::Down {
            label: "Offline test".into(),
        },
        ..Default::default()
    };
    assert!(!tdm_tools::refreshable(&dir), "system copy not refreshed");
    assert!(!dir.join("yt-dlp").exists(), "system helper left unmanaged");
    assert!(
        matches!(
            rt.block_on(tdm_tools::install_latest(&dir, &net, None)),
            Err(tdm_tools::Error::Adapter(tdm_engine::NetError::Down { .. }))
        ),
        "the explicit way to TDM's own copy goes to the network"
    );
    assert!(!dir.join("yt-dlp").exists(), "nothing installed on the way");

    // A managed copy still wins, and the explicit choice wins over both.
    let own = Installed {
        version: "2026.01.01".into(),
        exe: root.join("managed-yt-dlp"),
    };
    std::fs::write(&own.exe, b"managed").unwrap();
    #[cfg(target_os = "macos")]
    std::fs::create_dir(root.join("_internal")).unwrap();
    std::fs::create_dir_all(dir.join("yt-dlp")).unwrap();
    std::fs::write(
        dir.join("yt-dlp/current.json"),
        serde_json::to_vec(&own).unwrap(),
    )
    .unwrap();
    assert_eq!(tdm_tools::installed(&dir), Some(own.clone()));
    assert!(tdm_tools::refreshable(&dir), "a managed copy is refreshed");
    assert!(
        matches!(
            rt.block_on(tdm_tools::install_latest(&dir, &net, None)),
            Err(tdm_tools::Error::Adapter(tdm_engine::NetError::Down { .. }))
        ),
        "a managed copy still takes its ordinary update path"
    );

    let picked =
        tdm_tools::chosen::choose(&dir, Helper::YtDlp, &root.join("package/yt-dlp")).unwrap();
    assert_eq!(tdm_tools::installed(&dir), Some(picked.clone()));
    assert_eq!(
        rt.block_on(tdm_tools::install_latest(&dir, &net, None))
            .unwrap(),
        picked
    );
    tdm_tools::chosen::forget(&dir, Helper::YtDlp).unwrap();
    assert_eq!(tdm_tools::installed(&dir), Some(own.clone()));
    std::fs::remove_file(&own.exe).unwrap();
    assert_eq!(tdm_tools::installed(&dir), Some(system));

    gallery_dl(root, &dir, &rt, &net);
}

/// gallery-dl as yt-dlp (#571): the system's found, run with the options every release TDM
/// drives accepts (a distribution's may be old: Ubuntu 24.04's 1.26.9 refuses `--no-input`),
/// passed over for TDM's own copy and for the person's.
#[cfg(unix)]
fn gallery_dl(
    root: &std::path::Path,
    dir: &std::path::Path,
    rt: &tokio::runtime::Runtime,
    net: &tdm_engine::Options,
) {
    use tdm_tools::{Installed, chosen::Helper, gallery};

    let system = Installed {
        version: "system".into(),
        exe: root.join("bin/gallery-dl"),
    };
    assert_eq!(gallery::installed(dir), Some(system.clone()));
    let args: Vec<String> = tdm_tools::proc::gallery_dl(&system, &[], "https://x.test/g")
        .unwrap()
        .get_args()
        .map(|a| a.to_string_lossy().into_owned())
        .collect();
    assert_eq!(args, ["--ignore-config", "--", "https://x.test/g"]);
    // Helpers' Use TDM's own copy: an explicit install, to the network (refused here).
    if gallery::asset().is_some() {
        assert!(
            matches!(
                rt.block_on(gallery::install_latest(dir, net, None)),
                Err(tdm_tools::Error::Adapter(tdm_engine::NetError::Down { .. }))
            ),
            "the explicit way to TDM's own copy goes to the network"
        );
    }
    assert!(
        !dir.join("gallery-dl").exists(),
        "nothing installed on the way"
    );

    // TDM's own copy wins, and the person's over both.
    let own = Installed {
        version: "1.31.0".into(),
        exe: root.join("managed-gallery-dl"),
    };
    std::fs::write(&own.exe, b"managed").unwrap();
    std::fs::create_dir_all(dir.join("gallery-dl")).unwrap();
    std::fs::write(
        dir.join("gallery-dl/current.json"),
        serde_json::to_vec(&own).unwrap(),
    )
    .unwrap();
    assert_eq!(gallery::installed(dir), Some(own.clone()));
    let picked =
        tdm_tools::chosen::choose(dir, Helper::GalleryDl, &root.join("package/gallery-dl"))
            .unwrap();
    assert_eq!(picked.version, "1.26.9");
    assert_eq!(gallery::installed(dir), Some(picked));
    tdm_tools::chosen::forget(dir, Helper::GalleryDl).unwrap();
    std::fs::remove_file(&own.exe).unwrap();
    assert_eq!(gallery::installed(dir), Some(system));
}
