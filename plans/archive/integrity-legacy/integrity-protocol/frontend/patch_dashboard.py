import re

f = '/home/xibalba/Projects/integrity-protocol/web/src/pages/Dashboard.tsx'
with open(f, 'r') as fh:
    content = fh.read()

# 1. Shorten hero padding
content = content.replace("padding: '160px 0 100px',", "padding: '100px 0 60px',")

# 2. Reverse hero layout direction
content = content.replace(
    "className=\"flex-between\" style={{ alignItems: 'center' }}>",
    "className=\"flex-between\" style={{ alignItems: 'center', flexDirection: 'row-reverse' }}>",
    1
)

# 3. Hero text: right-align, remove subtitle, increase title, move circles left
content = content.replace(
    "<div style={{ maxWidth: '600px' }}>",
    "<div style={{ maxWidth: '600px', textAlign: 'right' }}>",
    1
)
content = content.replace(
    """<span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '24px', display: 'block' }}>Core Protocol Intelligence</span>
                            <h1 style={{ fontSize: '3.5rem',""",
    "<h1 style={{ fontSize: '5rem',",
)
content = content.replace(
    '<div className="flex gap-12">',
    '<div className="flex gap-12" style={{ justifyContent: \'flex-end\' }}>',
    1
)
content = content.replace(
    "justifyContent: 'flex-end', gap: '40px'",
    "justifyContent: 'flex-start', gap: '40px'",
    1
)

# 4. Header logo: 2x, remove text
content = content.replace(
    """<div className="logo-wrap">
                        <img src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" alt="Xibalba" style={{ height: '36px', width: 'auto' }} />
                        <div className="logo-text">
                            <div className="logo-title">XIBALBA <span>TRUST</span></div>
                            <div className="logo-subtitle">Protocol Management</div>
                        </div>
                    </div>""",
    """<div className="logo-wrap" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" alt="Xibalba" style={{ height: '72px', width: 'auto' }} />
                    </div>"""
)

# 5. Trust bar: span full width, 4-col grid
content = content.replace(
    """<section className="trust-bar">
                <div className="container">
                    <div className="trust-items" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>""",
    """<section className="trust-bar">
                <div style={{ padding: '0 40px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                    <div className="trust-items" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>"""
)

# 6. Main container wider
content = content.replace(
    "<main className=\"container\" style={{ paddingBottom: '120px' }}>",
    "<main className=\"container\" style={{ paddingBottom: '120px', maxWidth: '1600px', width: '100%' }}>"
)

# 7. Section 1 (Registry): full-width stacked layout, add text, taller cards
content = content.replace(
    """<section id="registry" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '60px', alignItems: 'start' }}>
                        <div>""",
    """<section id="registry" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ maxWidth: '1200px' }}>"""
)
content = content.replace(
    """L2 BASE NATIVE
                            </div>
                        </div>

                        <div>
                            <ProtocolStats />""",
    """L2 BASE NATIVE
                            </div>
                            <p className="section-subtitle" style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginTop: '16px' }}>
                                The overarching goal of the protocol is to provide a robust, sybil-resistant foundation for AI operations. By combining on-chain transparency with advanced actuarial modeling, we ensure that every participating agent is held to the highest standard of accountability. This paves the way for secure, autonomous economies where trust is cryptographically guaranteed rather than blindly assumed.
                            </p>
                        </div>

                        <div style={{ width: '100%' }}>
                            <ProtocolStats />"""
)
content = content.replace("{ i: 'agent_0', x: 0, y: 0, w: 4, h: 4 },", "{ i: 'agent_0', x: 0, y: 0, w: 4, h: 5 },")
content = content.replace("{ i: 'agent_1', x: 4, y: 0, w: 4, h: 4 },", "{ i: 'agent_1', x: 4, y: 0, w: 4, h: 5 },")
content = content.replace("{ i: 'agent_2', x: 8, y: 0, w: 4, h: 4 },", "{ i: 'agent_2', x: 8, y: 0, w: 4, h: 5 },")

# 8. Section 2 (Topology): swap text to right, add telemetry description
content = content.replace(
    """<section id="topology" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '60px', alignItems: 'start' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: '12px' }}>Topology & Signal</div>""",
    """<section id="topology" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '60px', alignItems: 'start' }}>
                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'visualizer', x: 0, y: 0, w: 8, h: 6 },
                                        { i: 'telemetry', x: 8, y: 0, w: 4, h: 6 },
                                    ]
                                }}
                                breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                                cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
                                rowHeight={100}
                                margin={[24, 24]}
                                isDraggable={false}
                                isResizable={false}
                            >
                                <div key="visualizer">
                                    <BlockchainVisualizer />
                                </div>
                                <div key="telemetry">
                                    <TelemetryStream />
                                </div>
                            </ResponsiveGridLayout>
                        )}
                        <div>
                            <div className="section-label" style={{ marginBottom: '12px' }}>Topology & Signal</div>"""
)
# Add extra telemetry text
content = content.replace(
    """Running in parallel, the <strong>Telemetry Stream</strong> provides the raw "heartbeat" of the network. Every row in the telemetry feed is a real-time signal of human intervention, model accuracy, and latency thresholds.
                            </p>
                        </div>
                        
                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'visualizer', x: 0, y: 0, w: 8, h: 6 },
                                        { i: 'telemetry', x: 8, y: 0, w: 4, h: 6 },
                                    ]
                                }}
                                breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                                cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
                                rowHeight={100}
                                margin={[24, 24]}
                                isDraggable={false}
                                isResizable={false}
                            >
                                <div key="visualizer">
                                    <BlockchainVisualizer />
                                </div>
                                <div key="telemetry">
                                    <TelemetryStream />
                                </div>
                            </ResponsiveGridLayout>
                        )}""",
    """Running in parallel, the <strong>Telemetry Stream</strong> provides the raw "heartbeat" of the network. Every row in the telemetry feed is a real-time signal of human intervention, model accuracy, and latency thresholds.
                            </p>
                            <p className="text-slate" style={{ fontSize: '0.95rem', lineHeight: 1.8, marginTop: '16px' }}>
                                The Telemetry Stream captures the pulse of the network. Each signal reflects live agent responses, model confidence metrics, and execution latency. These real-time data points are aggregated and processed by the Tri-Metric engine to dynamically adjust an agent's AIS.
                            </p>
                        </div>"""
)

# 9. Section 3 (Logic): full-width stacked, taller cards
content = content.replace(
    """<section id="logic" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '60px', alignItems: 'start' }}>
                        <div>""",
    """<section id="logic" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ maxWidth: '1200px' }}>"""
)
content = content.replace(
    """</p>
                        </div>

                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'math', x: 0, y: 0, w: 4, h: 5 },
                                        { i: 'vault', x: 4, y: 0, w: 4, h: 5 },
                                        { i: 'identity', x: 8, y: 0, w: 4, h: 5 },""",
    """</p>
                        </div>

                        <div style={{ width: '100%' }}>
                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'math', x: 0, y: 0, w: 4, h: 6 },
                                        { i: 'vault', x: 4, y: 0, w: 4, h: 6 },
                                        { i: 'identity', x: 8, y: 0, w: 4, h: 6 },""",
    1
)
# Close the wrapper div for section 3
content = content.replace(
    """                            </ResponsiveGridLayout>
                        )}
                    </div>
                </section>

                {/* SECTION 4:""",
    """                            </ResponsiveGridLayout>
                        )}
                        </div>
                    </div>
                </section>

                {/* SECTION 4:"""
)

# 10. Section 4 (Simulation): move text to left
content = content.replace(
    """<section id="simulation" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '60px', alignItems: 'start' }}>
                        {isMounted && (""",
    """<section id="simulation" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '60px', alignItems: 'start' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div className="section-label" style={{ marginBottom: '12px' }}>Action Center</div>
                            <h2 className="section-title" style={{ marginBottom: '24px', fontSize: '2.5rem' }}>Traffic Simulation</h2>
                            <p className="text-slate" style={{ fontSize: '0.95rem', lineHeight: 1.8 }}>
                                Verification requires a stress-tested environment. The <strong>Action Center</strong> allows protocol architects to simulate production-grade agent traffic in a controlled sandbox.
                            </p>
                            <p className="text-slate" style={{ fontSize: '0.95rem', lineHeight: 1.8, marginTop: '16px' }}>
                                Every simulated transaction performs a full <strong>On-Chain Handshake</strong>, mimicking the exact behavior of our L2 smart contracts on Base.
                            </p>
                            <button className="btn btn-outline" style={{ marginTop: '32px' }}>
                                <Radio size={16} style={{ marginRight: '10px' }} /> VIEW PROTOCOL DOCS
                            </button>
                        </div>
                        {isMounted && ("""
)
# Remove the old text block after the grid
content = content.replace(
    """                        </ResponsiveGridLayout>
                        )}

                        <div style={{ textAlign: 'right' }}>
                            <div className="section-label" style={{ flexDirection: 'row-reverse', marginBottom: '12px' }}>Action Center</div>
                            <h2 className="section-title" style={{ marginBottom: '24px', fontSize: '2.5rem' }}>Traffic Simulation</h2>
                            <p className="text-slate" style={{ fontSize: '0.95rem', lineHeight: 1.8 }}>
                                Verification requires a stress-tested environment. The <strong>Action Center</strong> allows protocol architects to simulate production-grade agent traffic in a controlled sandbox.
                            </p>
                            <p className="text-slate" style={{ fontSize: '0.95rem', lineHeight: 1.8, marginTop: '16px' }}>
                                Every simulated transaction performs a full <strong>On-Chain Handshake</strong>, mimicking the exact behavior of our L2 smart contracts on Base.
                            </p>
                            <button className="btn btn-outline" style={{ marginTop: '32px' }}>
                                <Radio size={16} style={{ marginRight: '10px' }} /> VIEW PROTOCOL DOCS
                            </button>
                        </div>""",
    """                        </ResponsiveGridLayout>
                        )}"""
)

# 11. Section 5 (Ledger): full-width stacked
content = content.replace(
    """<section id="ledger" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '60px', alignItems: 'start' }}>
                        <div>""",
    """<section id="ledger" style={{ marginBottom: '120px', scrollMarginTop: '100px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ maxWidth: '1200px' }}>"""
)
# Wrap the ledger grid in a full-width div
content = content.replace(
    """</p>
                        </div>

                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'bridge', x: 0, y: 0, w: 12, h: 4 },
                                        { i: 'ledger', x: 0, y: 4, w: 12, h: 5 },""",
    """</p>
                        </div>

                        <div style={{ width: '100%' }}>
                        {isMounted && (
                            <ResponsiveGridLayout 
                                className="layout"
                                layouts={{
                                    lg: [
                                        { i: 'bridge', x: 0, y: 0, w: 12, h: 4 },
                                        { i: 'ledger', x: 0, y: 4, w: 12, h: 5 },""",
    1
)
# Close the ledger wrapper div
content = content.replace(
    """                            </ResponsiveGridLayout>
                        )}
                    </div>
                </section>

            </main>""",
    """                            </ResponsiveGridLayout>
                        )}
                        </div>
                    </div>
                </section>

            </main>"""
)

# 12. Footer logo: 2x, remove text
content = content.replace(
    """<div className="flex-between">
                        <div className="logo-wrap">
                            <img src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" alt="Xibalba" style={{ height: '32px', width: 'auto', opacity: 0.8 }} />
                            <div className="logo-text">
                                <div className="logo-title" style={{ color: 'white', fontSize: '1.2rem' }}>XIBALBA <span>TRUST</span></div>
                                <div className="logo-subtitle" style={{ fontSize: '0.45rem' }}>Protocol Management v8.0</div>
                            </div>
                        </div>""",
    """<div className="flex-between" style={{ alignItems: 'center' }}>
                        <div className="logo-wrap">
                            <img src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" alt="Xibalba" style={{ height: '64px', width: 'auto', opacity: 0.8 }} />
                        </div>"""
)

with open(f, 'w') as fh:
    fh.write(content)

print("All patches applied successfully")
