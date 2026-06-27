document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle
    const themeToggle = document.getElementById("theme-toggle");
    const iconMoon = document.querySelector(".icon-moon");
    const iconSun = document.querySelector(".icon-sun");


    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("light-mode");
            if (document.documentElement.classList.contains("light-mode")) {
                localStorage.setItem("theme", "light");
            } else {
                localStorage.setItem("theme", "dark");
            }
        });
    }

    // Navigation Scroll Effect
    const nav = document.querySelector("nav");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            const isActive = hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
            hamburger.setAttribute("aria-expanded", isActive ? "true" : "false");
        });
        
        // Close menu on link click
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active");
                navLinks.classList.remove("active");
                hamburger.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Scroll Reveal Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.05
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-in').forEach((el) => {
        observer.observe(el);
    });

    // Scrollspy Navigation Highlights
    const sections = document.querySelectorAll("section, header.hero");
    const navItems = document.querySelectorAll(".nav-links a");

    const scrollspyOptions = {
        root: null,
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0
    };

    const scrollspyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navItems.forEach(link => {
                    const href = link.getAttribute("href");
                    if (href === `#${id}` || (id === "problem" && href === "#value-prop") || (!id && href === "#")) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });
            }
        });
    }, scrollspyOptions);

    sections.forEach(sec => scrollspyObserver.observe(sec));

    // FAQ Accordion Toggle Behavior
    const faqTriggers = document.querySelectorAll(".faq-trigger");
    faqTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            const isExpanded = trigger.getAttribute("aria-expanded") === "true";
            const item = trigger.closest(".faq-item");
            const content = item.querySelector(".faq-content");

            // Close all other open items for a clean single-open accordion feel
            faqTriggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger && otherTrigger.getAttribute("aria-expanded") === "true") {
                    otherTrigger.setAttribute("aria-expanded", "false");
                    otherTrigger.querySelector(".faq-icon").textContent = "+";
                    const otherItem = otherTrigger.closest(".faq-item");
                    otherItem.querySelector(".faq-content").style.maxHeight = "0px";
                    otherItem.classList.remove("faq-active");
                }
            });

            // Toggle current item
            if (isExpanded) {
                trigger.setAttribute("aria-expanded", "false");
                trigger.querySelector(".faq-icon").textContent = "+";
                content.style.maxHeight = "0px";
                item.classList.remove("faq-active");
            } else {
                trigger.setAttribute("aria-expanded", "true");
                trigger.querySelector(".faq-icon").textContent = "−";
                content.style.maxHeight = content.scrollHeight + "px";
                item.classList.add("faq-active");
            }
        });
    });

    // Scenario Card — tap-to-toggle on touch/mobile devices
    const scenarioCards = document.querySelectorAll(".scenario-card");
    scenarioCards.forEach(card => {
        card.addEventListener("click", () => {
            const wasExpanded = card.classList.contains("expanded");
            // Close all other expanded cards
            scenarioCards.forEach(other => other.classList.remove("expanded"));
            // Toggle current card
            if (!wasExpanded) {
                card.classList.add("expanded");
            }
        });
    });
});
