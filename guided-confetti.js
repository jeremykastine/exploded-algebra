/* A short, self-contained celebration. No network, sound, or pointer interception. */
window.ExplodedAlgebraConfetti = (() => {
    let stopCurrent = null;
    function start() {
        stopCurrent?.();
        const canvas = document.createElement('canvas');
        canvas.dataset.guidedConfetti = 'true';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;';
        const context = canvas.getContext('2d');
        if (!context) return () => {};
        document.body.appendChild(canvas);
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const colors = ['#ffd43b', '#ff5d8f', '#7c5cff', '#25c6da', '#36d399', '#ff914d'];
        let width, height, frame = null, lastTime = null, elapsed = 0, stopped = false;
        const particles = [];
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }
        function stop() {
            if (stopped) return;
            stopped = true;
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            canvas.remove();
            if (stopCurrent === stop) stopCurrent = null;
        }
        function onVisibilityChange() { if (document.hidden) stop(); }
        resize();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibilityChange);
        stopCurrent = stop;
        const count = reduced ? 55 : (width < 600 ? 240 : 360);
        for (let i = 0; i < count; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const speed = (0.55 + Math.random() * 0.65) * Math.min(width, 1000);
            const angle = -Math.PI / 2 + side * (0.2 + Math.random() * 0.95);
            particles.push({
                x: reduced ? Math.random() * width : (side === 1 ? width * 0.1 : width * 0.9),
                y: reduced ? Math.random() * height * 0.8 : height * 0.76,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.95,
                delay: reduced ? 0 : Math.floor(i / (count / 3)) * 0.28,
                color: colors[i % colors.length], size: 5 + Math.random() * 7,
                rotation: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 12,
                phase: Math.random() * Math.PI * 2, shape: i % 7
            });
        }
        function draw(time) {
            if (stopped) return;
            const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.04);
            lastTime = time;
            elapsed += dt;
            const duration = reduced ? 1.1 : 4.8;
            context.clearRect(0, 0, width, height);
            for (const p of particles) {
                if (elapsed < p.delay) continue;
                if (!reduced) {
                    const drag = Math.exp(-1.05 * dt);
                    p.vx *= drag;
                    p.vy += 520 * dt;
                    p.x += (p.vx + Math.sin(elapsed * 5 + p.phase) * 24) * dt;
                    p.y += p.vy * dt;
                    p.rotation += p.spin * dt;
                }
                context.save();
                context.globalAlpha = Math.min(1, (duration - elapsed) / (reduced ? 0.4 : 0.9));
                context.translate(p.x, p.y);
                context.rotate(p.rotation);
                context.scale(1, reduced ? 1 : 0.25 + Math.abs(Math.cos(elapsed * 8 + p.phase)) * 0.75);
                context.fillStyle = p.color;
                if (p.shape === 0) {
                    context.beginPath();
                    context.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
                    context.fill();
                } else {
                    context.fillRect(-p.size / 2, -p.size / 3, p.size, p.shape === 1 ? p.size * 2.5 : p.size * 0.65);
                }
                context.restore();
            }
            if (elapsed >= duration) stop();
            else frame = requestAnimationFrame(draw);
        }
        frame = requestAnimationFrame(draw);
        return stop;
    }
    return { start };
})();
