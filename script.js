// scripts.js

const canvases = {
    mandelbrot: document.getElementById('mandelbrot'),
    mandelbrot_overlay: document.getElementById('mandelbrot-overlay'),
    julia: document.getElementById('julia'),
    julia_overlay: document.getElementById('julia-overlay')
};

const resolution = canvases.mandelbrot.width;

// WebGL setup
const gl_mandelbrot = canvases.mandelbrot.getContext('webgl', { preserveDrawingBuffer: true });
const gl_julia = canvases.julia.getContext('webgl', { preserveDrawingBuffer: true });

// Colormap textures
let colormapTexture_mandelbrot = gl_mandelbrot.createTexture();
let colormapTexture_julia = gl_julia.createTexture();

// Vertex shader (same for both)
const vertexShaderSource = `
    attribute vec2 position;
    varying vec2 v_position;
    void main() {
        v_position = position;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// Fragment shader for fractals
const fragmentShaderSource = `
    precision highp float;
    varying vec2 v_position;
    
    uniform vec2 u_domain_min;
    uniform vec2 u_domain_max;
    uniform vec2 u_c_value;
    uniform vec2 u_z_value;
    uniform int u_max_iterations;
    uniform int u_fractal_type;
    uniform int u_is_julia;
    uniform sampler2D u_colormap_texture;
    
    vec2 fractal_function(vec2 z, vec2 c, int fractal_type) {
        if (fractal_type == 0) { // Standard Mandelbrot
            return vec2(
                z.x * z.x - z.y * z.y + c.x,
                2.0 * z.x * z.y + c.y
            );
        } else if (fractal_type == 1) { // Cubic
            return vec2(
                z.x * z.x * z.x - 3.0 * z.x * z.y * z.y + c.x,
                3.0 * z.x * z.x * z.y - z.y * z.y * z.y + c.y
            );
        } else if (fractal_type == 2) { // Quartic
            return vec2(
                z.x * z.x * z.x * z.x - 6.0 * z.x * z.x * z.y * z.y + z.y * z.y * z.y * z.y + c.x,
                4.0 * z.x * z.y * (z.x * z.x - z.y * z.y) + c.y
            );
        } else if (fractal_type == 3) { // Hyperbolic
            return vec2(
                z.x * z.x + z.y * z.y + c.x,
                2.0 * z.x * z.y - c.y
            );
        } else if (fractal_type == 4) { // Burning Ship
            return vec2(
                z.x * z.x - z.y * z.y + c.x,
                abs(2.0 * z.x * z.y) + c.y
            );
        } else if (fractal_type == 5) { // Tricorn
            return vec2(
                z.x * z.x - z.y * z.y + c.x,
                -2.0 * z.x * z.y + c.y
            );
        }
        return z;
    }
    
    float get_norm_sq(vec2 z, int fractal_type) {
        if (fractal_type == 3 || fractal_type == 5) { // Hyperbolic or Tricorn
            return z.x * z.x - z.y * z.y;
        }
        return z.x * z.x + z.y * z.y;
    }
    
    float get_escape_radius(int fractal_type) {
        if (fractal_type == 3) return 10.0; // Hyperbolic
        return 2.0; // All others
    }
    
    int escape_time(vec2 z_init, vec2 c) {
        vec2 z = z_init;
        float esc_rad = get_escape_radius(u_fractal_type);
        float esc_rad_sq = esc_rad * esc_rad;
        
        for (int n = 1; n < 10000; n++) {
            if (n >= u_max_iterations) break;
            
            float norm_sq = abs(get_norm_sq(z, u_fractal_type));
            if (norm_sq >= esc_rad_sq) return n;
            
            z = fractal_function(z, c, u_fractal_type);
        }
        return 0;
    }

    vec3 colormap(float value) {
        float t = clamp(value / float(u_max_iterations), 0.0, 1.0);
        return texture2D(u_colormap_texture, vec2(t, 0.5)).rgb;
    }
    
    void main() {
        vec2 coord = mix(u_domain_min, u_domain_max, (v_position + 1.0) * 0.5);
        
        int iterations;
        if (u_is_julia == 1) {
            iterations = escape_time(coord, u_c_value);
        } else {
            iterations = escape_time(vec2(0.0, 0.0), coord);
        }
        
        if (iterations == 0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            vec3 color = colormap(float(iterations));
            gl_FragColor = vec4(color, 1.0);
        }
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function setupWebGL(gl) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1
    ]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    return program;
}

const program_mandelbrot = setupWebGL(gl_mandelbrot);
const program_julia = setupWebGL(gl_julia);

var domains = {
    mandelbrot: [[-2,2],[-2,2]],
    julia: [[-2,2],[-2,2]]
}

var z_value = [0,0];
var c_value = [0,0];
var current_fractal = 0;
var max_iterations = 100;
var color_map_resolution = 1000;
var current_colormap = 0;
var c_locked = true;

function renderFractal(gl, program, domain, isJulia) {
    gl.useProgram(program);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(program, 'u_domain_min'), domain[0][0], domain[1][0]);
    gl.uniform2f(gl.getUniformLocation(program, 'u_domain_max'), domain[0][1], domain[1][1]);
    gl.uniform2f(gl.getUniformLocation(program, 'u_c_value'), c_value[0], c_value[1]);
    gl.uniform2f(gl.getUniformLocation(program, 'u_z_value'), z_value[0], z_value[1]);
    gl.uniform1i(gl.getUniformLocation(program, 'u_max_iterations'), max_iterations);
    gl.uniform1i(gl.getUniformLocation(program, 'u_fractal_type'), current_fractal);
    gl.uniform1i(gl.getUniformLocation(program, 'u_is_julia'), isJulia ? 1 : 0);

    // Colormap
    gl.activeTexture(gl.TEXTURE0);
    const texture = isJulia ? colormapTexture_julia : colormapTexture_mandelbrot;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_colormap_texture'), 0);
    
    // Render
    gl.viewport(0, 0, resolution, resolution);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function plot(fracs=["julia","mandelbrot"]) {
    if (fracs.includes("mandelbrot")) {
        renderFractal(gl_mandelbrot, program_mandelbrot, domains.mandelbrot, false);
    }
    if (fracs.includes("julia")) {
        renderFractal(gl_julia, program_julia, domains.julia, true);
    }
}

function draw_pointer(point, canvas, domain, color='red', size=8) {
    const ctx = canvas.getContext('2d');
    const coords = [
        (point[0]-domain[0][0]) / (domain[0][1]-domain[0][0]) * resolution,
        (1 - (point[1]-domain[1][0]) / (domain[1][1]-domain[1][0])) * resolution
    ];
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coords[0] - size, coords[1]);
    ctx.lineTo(coords[0] + size, coords[1]);
    ctx.moveTo(coords[0], coords[1] - size);
    ctx.lineTo(coords[0], coords[1] + size);
    ctx.stroke();
}

function draw_pointers() {
    draw_pointer(c_value, canvases.mandelbrot_overlay, domains.mandelbrot);
    draw_pointer(z_value, canvases.julia_overlay, domains.julia);
    document.getElementById("c_rl").value = c_value[0];
    document.getElementById("c_im").value = c_value[1];
    document.getElementById("z_rl").value = z_value[0];
    document.getElementById("z_im").value = z_value[1];
}

// Utility functions
function update_c() {
    const form = document.getElementById('c_form')
    c_value = [
        parseFloat(form.elements["real"].value),
        parseFloat(form.elements["imag"].value)
    ];
    plot(["julia"]);
    draw_pointers();
}

function update_z() {
    const form = document.getElementById('z_form')
    z_value = [
        parseFloat(form.elements["real"].value),
        parseFloat(form.elements["imag"].value)
    ];
    draw_pointers();
}

function toggle_c_lock() {
    const btn = document.getElementById("c_lock_btn");
    if (c_locked) {
        btn.innerHTML = "Lock";
        c_locked = false;
    } else {
        btn.innerHTML = "Unlock";
        c_locked = true;
    }
}

function reset_mandelbrot() {
    domains.mandelbrot = [[-2, 2], [-2, 2]];
    plot(["mandelbrot"]);
    draw_pointers();
}

function reset_julia() {
    domains.julia = [[-2, 2], [-2, 2]];
    plot(["julia"]);
    draw_pointers();
}

function reset() {
    z_value = [0,0];
    c_value = [0,0];
    reset_mandelbrot();
    reset_julia();
}

function update_fractal_type() {
    current_fractal = parseInt(document.getElementById('fractal_type').value);
    plot();
}

const cmap_functions = {
    'red': (value) => {
        let i = 1.0 - Math.max(0, Math.min(1, value / color_map_resolution));
        return [
            Math.round(Math.max(0, Math.sin(Math.PI * i)) * 100) + 155,
            Math.round(Math.max(0, Math.sin(Math.PI * (i + 1/3))) * 255),
            Math.round(Math.max(0, Math.sin(Math.PI * (i + 2/3))) * 255)
        ];
    },
    'tropical': (value) => {
        var i = Math.min(value / color_map_resolution, 1);
        return [
            Math.round(Math.max(0, Math.sin(Math.PI * i)) * 255),
            Math.round(Math.max(0, Math.sin(Math.PI * (i + 1/3))) * 255),
            Math.round(Math.max(0, Math.sin(Math.PI * (i + 2/3))) * 255)
        ];
    },
    'viridis': (value) => {
        const i = Math.min(value / color_map_resolution, 1);
        return [
            Math.round(Math.pow(Math.max(0, Math.sin(Math.PI * i / 2)), 1.5) * 255),
            Math.round(Math.pow(i, 0.5) * 255),
            Math.round(Math.max(0, Math.cos(Math.PI * i / 2)) * 255)
        ];
    },
    'flower': (value) => {
        var i = Math.min(value / color_map_resolution, 1);
        return [
            Math.round((0.9 - 0.3 * Math.pow(i, 2)) * 255),
            Math.round((0.6 + 0.4 * Math.max(0, Math.sin(Math.PI * i))) * 255),
            Math.round((0.8 + 0.2 * Math.max(0, Math.sin(Math.PI * i * 3))) * 255)
        ];
    },
    'purple': (value) => {
        var i = Math.min(value / color_map_resolution, 1);
        
        return [
            Math.round(Math.abs(Math.sin(Math.PI * i + 1/3) ** 2) * 255),
            Math.round(Math.max(Math.sin(Math.PI * (i)) ** 8, 0) * 160),
            Math.round(Math.abs(Math.sin(Math.PI * (i + 1/7)) ** 2) * 255)
        ];
    },
    'halloween': (value) => {
        var i = Math.min(value / color_map_resolution, 1);
        
        return [
            Math.round(Math.abs(Math.sin(Math.PI * i + 1/3) ** 2) * 255),
            Math.round(Math.max(Math.sin(Math.PI * (i)) ** 8, 0) * 100),
            Math.round(Math.max(Math.sin(Math.PI * (i + 2/7)) ** 3, 0) * 255)
        ];
    }
}

function update_colormap_texture(gl, texture, cmap_id) {
    const textureData = new Uint8Array(color_map_resolution * 3);
    for (let i = 0; i < color_map_resolution; i++) {
        const [r, g, b] = cmap_functions[cmap_id](i);
        textureData[i * 3] = r;
        textureData[i * 3 + 1] = g;
        textureData[i * 3 + 2] = b;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, color_map_resolution, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, textureData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

function update_cmap() {
    const new_color = document.getElementById('cmap').value;
    colormapTexture_mandelbrot = update_colormap_texture(gl_mandelbrot, colormapTexture_mandelbrot, new_color);
    colormapTexture_julia = update_colormap_texture(gl_julia, colormapTexture_julia, new_color);
    plot();
}

function download_canvas(canvas_id) {
    const link = document.createElement('a');
    link.download = `${canvas_id}.png`;
    link.href = canvases[canvas_id].toDataURL('image/png');
    link.click();
}

// Conversion function for complex coordinate to pixel
const value = (point, domain) => [
    point[0] / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
    (1 - point[1] / resolution) * (domain[1][1]-domain[1][0]) + domain[1][0]
];

// Iteration functions
const fractal_types = {
    0: { // standard mandelbrot
        fc: (z, c) => [z[0]**2 - z[1]**2 + c[0], 2*z[0]*z[1] + c[1]]
    },
    1: { // cubic
        fc: (z, c) => [z[0]**3 - 3*z[0]*z[1]**2 + c[0], 3*z[0]**2*z[1] - z[1]**3 + c[1]]
    },
    2: { // quartic
        fc: (z, c) => [z[0]**4 - 6*z[0]**2*z[1]**2 + z[1]**4 + c[0], 4*z[0]**3*z[1] - 4*z[0]*z[1]**3 + c[1]]
    },
    3: { // hyperbolic
        fc: (z, c) => [z[0]**2 + z[1]**2 + c[0], 2*z[0]*z[1] - c[1]]
    },
    4: { // burning ship
        fc: (z, c) => [z[0]**2 - z[1]**2 + c[0], Math.abs(2*z[0]*z[1]) + c[1]]
    },
    5: { // tricorn
        fc: (z, c) => [z[0]**2 - z[1]**2 + c[0], -2*z[0]*z[1] + c[1]]
    }
}

function iterate() {
    z_value = fractal_types[current_fractal].fc(z_value, c_value);
    draw_pointers();
}

let iteration_interval = null;
let play_speed = 500;

function toggle_iteration() {
    const btn = document.getElementById("iteration_toggle");
    if (iteration_interval === null) {
        iteration_interval = setInterval(iterate, play_speed);
        btn.innerHTML = "Pause";
    } else {
        clearInterval(iteration_interval);
        iteration_interval = null;
        btn.innerHTML = "Play";
    }
}

// Scaling function
const scale = (domain, factor, p) => [
    [
        p[0] - (domain[0][1] - domain[0][0]) * factor / 2,
        p[0] + (domain[0][1] - domain[0][0]) * factor / 2
    ],
    [
        p[1] - (domain[1][1] - domain[1][0]) * factor / 2,
        p[1] + (domain[1][1] - domain[1][0]) * factor / 2
    ]
];

function scale_mandelbrot(factor) {
    domains.mandelbrot = scale(domains.mandelbrot, factor, c_value);
    plot(["mandelbrot"]);
    draw_pointer(c_value, canvases.mandelbrot_overlay, domains.mandelbrot);
}

function scale_julia(factor) {
    domains.julia = scale(domains.julia, factor, z_value);
    plot(["julia"]);
    draw_pointer(z_value, canvases.julia_overlay, domains.julia);
}

// Event listeners
canvases.mandelbrot.addEventListener('click', (event) => {
    if (!c_locked) toggle_c_lock();
    const rect = canvases.mandelbrot.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    c_value = value(point, domains.mandelbrot);
    plot(["julia"]);
    draw_pointers();
});

canvases.julia.addEventListener('click', (event) => {
    const rect = canvases.julia.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    z_value = value(point, domains.julia);
    draw_pointers();
});

let animationFrameRequested = false;

document.getElementById("esc_time_slider").addEventListener('input', function() {
    if (this.value <= 10) {
        max_iterations = this.value
    } else if (this.value <= 20) {
        max_iterations = (this.value-10)*10
    } else if (this.value <= 30) {
        max_iterations = (this.value-20)*100
    } else {
        max_iterations = (this.value-30)*1000
    }
    document.getElementById("esc_time_indicator").innerHTML = max_iterations;
    if (!animationFrameRequested) {
        animationFrameRequested = true;
        requestAnimationFrame(() => {
            animationFrameRequested = false;
            plot();
        });
    }
});

document.getElementById("play_speed_slider").addEventListener('input', function() {
    document.getElementById("play_speed_indicator").innerHTML = play_speed = parseInt(this.value);
    if (iteration_interval !== null) {
        clearInterval(iteration_interval);
        iteration_interval = setInterval(iterate, play_speed);
    }
});

// Keyboard shortcuts
const key_actions = {
    'r': reset,
    'z': () => scale_mandelbrot(0.5),
    'x': () => scale_mandelbrot(2),
    'q': () => scale_julia(0.5),
    'w': () => scale_julia(2),
    'i': iterate,
    'p': toggle_iteration,
    'l': toggle_c_lock,
};

document.addEventListener('keydown', (e) => {
    if (e.key in key_actions) key_actions[e.key]();
});

// Touch/gesture support
["gesturestart", "gesturechange"].forEach(evt =>
    canvases.mandelbrot.addEventListener(evt, e => e.preventDefault(), {passive: false})
);

canvases.mandelbrot.addEventListener('gestureend', (e) => {
    e.preventDefault();
    if(e.scale > 1.0) scale_mandelbrot(0.5);
    else if (e.scale < 1.0) scale_mandelbrot(2);
}, {passive: false});

["gesturestart", "gesturechange"].forEach(evt =>
    canvases.julia.addEventListener(evt, e => e.preventDefault(), {passive: false})
);

canvases.julia.addEventListener('gestureend', (e) => {
    e.preventDefault();
    if(e.scale > 1.0) scale_julia(0.5);
    else if (e.scale < 1.0) scale_julia(2);
}, {passive: false});

// Mouse move for unlocked mode
canvases.mandelbrot.addEventListener('pointermove', (event) => {
    if (!c_locked) {
        latestMouseEvent = event;
        if (!animationFrameRequested) {
            animationFrameRequested = true;
            requestAnimationFrame(() => {
                animationFrameRequested = false;
                const rect = canvases.mandelbrot.getBoundingClientRect();
                const point = [latestMouseEvent.clientX - rect.left, latestMouseEvent.clientY - rect.top];
                c_value = value(point, domains.mandelbrot);
                plot(["julia"]);
                draw_pointers();
            });
        }
    }
});

// Initialize
update_colormap_texture(gl_mandelbrot, colormapTexture_mandelbrot, 'red');
update_colormap_texture(gl_julia, colormapTexture_julia, 'red');

plot();
draw_pointers();