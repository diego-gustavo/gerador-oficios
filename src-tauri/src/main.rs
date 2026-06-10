#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Executável mínimo: toda lógica fica na lib para permitir testes.
    gerador_oficios_lib::run();
}
