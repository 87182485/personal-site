// Intersection Observer for fade-in animations on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply initial styles and observe elements for animations
document.addEventListener('DOMContentLoaded', () => {
    const glassCards = document.querySelectorAll('.glass-card');
    const sections = document.querySelectorAll('section > .container');

    const animateElements = [...glassCards, ...sections];

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Interactive mouse glow effect on project cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08) 0%, var(--glass-bg) 50%)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.background = 'var(--glass-bg)';
        });
    });

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'light') {
            // Moon icon for light mode (to switch back to dark)
            themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            `;
        } else {
            // Sun icon for dark mode (to switch to light)
            themeIcon.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            `;
        }
    }

    // --- Three.js Geometry Integration ---
    initThreeJS();

    // --- D3.js Chart Integration ---
    initD3Chart();
});

function initThreeJS() {
    const container = document.getElementById('threejs-container');
    if (!container || typeof THREE === 'undefined') return;

    // Setup Scene
    const scene = new THREE.Scene();
    
    // Setup Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4;

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Prepend canvas so it stays behind the text overlay
    container.insertBefore(renderer.domElement, container.firstChild);

    // Create Geometry (Data Network)
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPrimary = new THREE.Color(0x6366f1); // Indigo
    const colorSecondary = new THREE.Color(0x8b5cf6); // Purple

    for (let i = 0; i < particleCount; i++) {
        // Random positions within a sphere
        const r = 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        // Mix colors
        const mixedColor = colorPrimary.clone().lerp(colorSecondary, Math.random());
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create Particles Material
    const pMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    const particles = new THREE.Points(geometry, pMaterial);
    
    // Create Line Connections
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.2
    });

    // Group to hold everything
    const networkGroup = new THREE.Group();
    networkGroup.add(particles);

    // Naive connection of nearby particles
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const maxDistance = 0.8;

    for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < maxDistance * maxDistance) {
                linePositions.push(
                    positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                    positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                );
            }
        }
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    networkGroup.add(lines);

    scene.add(networkGroup);

    // Animation variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Interaction Events
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            
            const deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    Math.toRadians(deltaMove.y * 1),
                    Math.toRadians(deltaMove.x * 1),
                    0,
                    'XYZ'
                ));
            
            networkGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, networkGroup.quaternion);
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    
    // Helper to convert deg to rad
    Math.toRadians = function(degrees) { return degrees * Math.PI / 180; };

    // Handle Window Resize
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Auto-rotation if not being dragged
        if (!isDragging) {
            networkGroup.rotation.x += 0.002;
            networkGroup.rotation.y += 0.004;
        }

        renderer.render(scene, camera);
    }
    
    animate();
}

function initD3Chart() {
    const container = document.getElementById('d3-container');
    if (!container || typeof d3 === 'undefined') return;

    // Use a fixed viewBox so the SVG scales automatically inside the responsive container
    const width = 400;
    const height = 300;
    const margin = { top: 40, right: 20, bottom: 80, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
        .insert('svg', ':first-child')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('width', '100%')
        .style('height', '100%')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Static industry experience data
    const data = [
        { industry: 'CRM Software', years: 2.5 },
        { industry: 'Autonomous Vehicles', years: 1.8 },
        { industry: 'Data Pipelines', years: 3.5 },
        { industry: 'ML Tooling', years: 2.0 }
    ];

    const x = d3.scaleBand()
        .domain(data.map(d => d.industry))
        .range([0, chartWidth])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.years) + 0.5])
        .range([chartHeight, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .attr('class', 'axis x-axis')
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-25)");

    // Y axis
    svg.append('g')
        .attr('class', 'axis y-axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + ' Yrs'));

    // Draw bars with initial animation
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.industry))
        .attr('width', x.bandwidth())
        .attr('y', chartHeight)
        .attr('height', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150)
        .attr('y', d => y(d.years))
        .attr('height', d => chartHeight - y(d.years));

    // Optional: Add value labels on top of bars
    svg.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .style('fill', 'var(--text-color)')
        .style('font-size', '12px')
        .style('font-family', 'Inter, sans-serif')
        .style('text-anchor', 'middle')
        .attr('x', d => x(d.industry) + x.bandwidth() / 2)
        .attr('y', chartHeight)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150 + 500)
        .attr('y', d => y(d.years) - 5)
        .style('opacity', 1)
        .text(d => d.years);
}
