#include <iostream>
#include <vector>
#include <cassert>
#include <cmath>

// Trick to include main.cpp without executing its main() function
#define main main_app
#include "main.cpp"
#undef main

void test_risk_controller_killswitch() {
    std::cout << "[TEST] test_risk_controller_killswitch... ";
    double risk = RiskController::calculate_risk_limit(399);
    assert(risk == 0.0);
    std::cout << "PASSED\n";
}

void test_risk_controller_normal() {
    std::cout << "[TEST] test_risk_controller_normal... ";
    double risk1 = RiskController::calculate_risk_limit(1000);
    assert(std::abs(risk1 - 1.0) < 1e-9);

    double risk2 = RiskController::calculate_risk_limit(850);
    assert(std::abs(risk2 - 0.7225) < 1e-9); // 0.85^2
    std::cout << "PASSED\n";
}

void test_aligner_in_tolerance() {
    std::cout << "[TEST] test_aligner_in_tolerance... ";
    ZeroDriftAligner aligner(2, 1000000);

    aligner.ingest({0, 45000.0, 1000});
    aligner.ingest({1, 45001.0, 2000});

    std::vector<MarketTick> aligned;
    double drift = 0;
    bool success = aligner.align_state_vector(aligned, drift);

    assert(success == true);
    assert(drift == 1000.0);
    assert(aligned.size() == 2);
    assert(aligned[0].stream_id == 0);
    assert(aligned[1].stream_id == 1);
    std::cout << "PASSED\n";
}

void test_aligner_out_of_tolerance() {
    std::cout << "[TEST] test_aligner_out_of_tolerance... ";
    ZeroDriftAligner aligner(2, 1000000);

    aligner.ingest({0, 45000.0, 1000});
    aligner.ingest({1, 45001.0, 2000000});

    std::vector<MarketTick> aligned;
    double drift = 0;
    bool success = aligner.align_state_vector(aligned, drift);

    // Should fail and drop oldest
    assert(success == false);
    assert(drift == 1999000.0);
    assert(aligned.empty());

    // Add new tick for dropped stream
    aligner.ingest({0, 45000.5, 2000500});
    success = aligner.align_state_vector(aligned, drift);

    assert(success == true);
    assert(drift == 500.0);
    assert(aligned.size() == 2);
    std::cout << "PASSED\n";
}

void test_aligner_empty() {
    std::cout << "[TEST] test_aligner_empty... ";
    ZeroDriftAligner aligner(2, 1000000);
    std::vector<MarketTick> aligned;
    double drift = 0;
    bool success = aligner.align_state_vector(aligned, drift);

    assert(success == false);
    std::cout << "PASSED\n";
}

int main() {
    std::cout << "==========================================\n";
    std::cout << " Running Xibalba-Quant Unit Tests\n";
    std::cout << "==========================================\n";

    test_risk_controller_killswitch();
    test_risk_controller_normal();
    test_aligner_in_tolerance();
    test_aligner_out_of_tolerance();
    test_aligner_empty();

    std::cout << "==========================================\n";
    std::cout << " ALL TESTS PASSED SUCCESSFULLY.\n";
    std::cout << "==========================================\n";
    return 0;
}
