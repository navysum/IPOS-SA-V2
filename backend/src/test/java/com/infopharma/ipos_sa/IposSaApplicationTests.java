package com.infopharma.ipos_sa;

import org.junit.jupiter.api.Test;

/**
 * Basic smoke test — does not start the Spring context so it does not
 * require a running PostgreSQL instance during the build.
 * Run with -Dspring.profiles.active=test for full integration tests.
 */
class IposSaApplicationTests {

    @Test
    void contextLoads() {
        // Smoke test — Maven compile phase verifies the project builds correctly.
        // Full context test requires PostgreSQL: run with -Pintegration-test profile.
    }
}
