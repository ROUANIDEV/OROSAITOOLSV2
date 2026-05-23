// Prevents additional console window on Windows in release.
// Do not remove this line.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    orosaitools_lib::run();
}