use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let bb_rs_path = manifest_dir.join("bb_rs");

    // Build the bb_rs crate
    let status = Command::new("cargo")
        .arg("build")
        .arg("--release")
        .arg("--target-dir")
        .arg("/tmp/bb_rs_target")
        .current_dir(&bb_rs_path)
        .status()
        .expect("Failed to build bb_rs crate");

    if !status.success() {
        panic!("Failed to build bb_rs crate");
    }

    // Link the bb_rs static library
    let lib_path = std::path::PathBuf::from("/tmp/bb_rs_target/release");
    println!("cargo:rustc-link-search=native={}", lib_path.display());
    println!("cargo:rustc-link-lib=static=bb_rs");
}
