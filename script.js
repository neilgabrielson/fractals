// script.js

const resolution = 400;

const mandelbrot_canvas = document.getElementById('mandelbrot');
const julia_canvas = document.getElementById('julia');

const mandelbrot_overlay = document.getElementById('mandelbrot-overlay');
const julia_overlay = document.getElementById('julia-overlay');

[mandelbrot_canvas, mandelbrot_overlay, julia_canvas, julia_overlay].forEach(canvas => {
    canvas.width, canvas.height = resolution;
});

const fractal_types = {
    standard: {
        fc: (z, c) => [
            z[0]**2 - z[1]**2 + c[0],
            2*z[0]*z[1] + c[1]
        ],
        norm_sq: z => z[0]**2 + z[1]**2,
        esc_rad: 2
    },
    hyperbolic: {
        fc: (z, c) => [
            z[0]**2 + z[1]**2 + c[0],
            2*z[0]*z[1] - c[1]
        ],
        norm_sq: z => z[0]**2 - z[1]**2,
        esc_rad: 10
    },
    cubic: {
        fc: (z, c) => [
            z[0]**3 - 3*z[0]*z[1]**2 + c[0],
            3*z[0]**2*z[1] - z[1]**3 + c[1]
        ],
        norm_sq: z => z[0]**2 + z[1]**2,
        esc_rad: 2
    },
    quartic: {
        fc: (z, c) => [
            z[0]**4 - 6*z[0]**2*z[1]**2 + z[1]**4 + c[0],
            4*z[0]**3*z[1] - 4*z[0]*z[1]**3 + c[1]
        ],
        norm_sq: z => z[0]**2 + z[1]**2,
        esc_rad: 2
    },
    burning_ship: {
        fc: (z, c) => [
            z[0]**2 - z[1]**2 + c[0],
            Math.abs(2*z[0]*z[1]) + c[1]
        ],
        norm_sq: z => z[0]**2 + z[1]**2,
        esc_rad: 2
    },
    tricorn: {
        fc: (z, c) => [
            z[0]**2 - z[1]**2 + c[0],
            -2*z[0]*z[1] + c[1]
        ],
        norm_sq: z => z[0]**2 - z[1]**2,
        esc_rad: 2
    },

}

// set initial domains
var mandelbrot_domain = [[-2,2],[-2,2]]
var julia_domain = [[-2,2],[-2,2]]

// set z and c values
var z_value = [0,0];
var c_value = [0,0];

var current_fractal = 'standard';
var max_iterations = 100;

var c_locked = true;

var cmap = 'dark_red';

// define escape time function
function escape_time(z, c) {
    const {fc, norm_sq, esc_rad} = fractal_types[current_fractal];
    for (let n = 1; n < max_iterations; n++) {
        if (Math.abs(norm_sq(z)) >= esc_rad**2) return n;
        else z = fc(z,c);
    }
    return 0;
}

// define pixel to complex cordinate function
const value = (point, domain) => [
    point[0] / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
    (1 - point[1] / resolution) * (domain[1][1]-domain[1][0]) + domain[1][0]
];

// draw pointer
function draw_pointer(point, canvas, domain, color='red',size=8) {
    const ctx = canvas.getContext('2d');
    const coords = [
        (point[0]-domain[0][0]) / (domain[0][1]-domain[0][0]) * resolution,
        (1 - (point[1]-domain[1][0]) / (domain[1][1]-domain[1][0])) * resolution
    ];
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // initialize
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal line
    ctx.moveTo(coords[0] - size, coords[1]);
    ctx.lineTo(coords[0] + size, coords[1]);
    // Vertical line
    ctx.moveTo(coords[0], coords[1] - size);
    ctx.lineTo(coords[0], coords[1] + size);
    ctx.stroke();
}

function draw_pointers() {
    draw_pointer(c_value, mandelbrot_overlay, mandelbrot_domain);
    draw_pointer(z_value, julia_overlay, julia_domain);
    document.getElementById("c_rl").value = c_value[0];
    document.getElementById("c_im").value = c_value[1];
    document.getElementById("z_rl").value = z_value[0];
    document.getElementById("z_im").value = z_value[1];
}

const cmaps = {
    aqua: (value, max=100) => {
        var i = Math.min(value / max, 1);
        const r = Math.round(255 * Math.sin(Math.PI * i));
        const g = Math.round(255 * Math.sin(Math.PI * (i + 1/3)));
        const b = Math.round(255 * Math.sin(Math.PI * (i + 2/3)));
        return [r, g, b];
    },
    dark_red: (value, max=100) => {
        var i = 1-Math.min(value / max, 1);
        const r = Math.round(255 * Math.sin(Math.PI * i));
        const g = Math.round(255 * Math.sin(Math.PI * (i + 1/3)));
        const b = Math.round(255 * Math.sin(Math.PI * (i + 2/3)));
        return [r, g, b];
    },
    viridis: (value, max=100) => {
        const i = Math.min(value / max, 1);
        const r = Math.round(255 * Math.pow(Math.sin(Math.PI * i / 2), 1.5));
        const g = Math.round(255 * Math.pow(i, 0.5));
        const b = Math.round(255 * Math.cos(Math.PI * i / 2));
        return [r, g, b];
    }
}

function plot_mandelbrot(canvas=mandelbrot_canvas, domain=mandelbrot_domain) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const iterations = escape_time(
                [0,0],
                value([x,y],domain)
            );
            const color = iterations === 0 ? [0,0,0] : cmaps[cmap](iterations);
            const index = (y * canvas.width + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function plot_julia() {
    const ctx = julia_canvas.getContext("2d");
    const imageData = ctx.createImageData(resolution, resolution);
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const iterations = escape_time(
                value([x,y],julia_domain),
                c_value
            );
            const color = iterations === 0 ? [0,0,0] : cmaps[cmap](iterations);
            const index = (y * resolution + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function plot() {
    plot_julia();
    plot_mandelbrot();
}

plot();
draw_pointers();

// utility functions

function update_c() {
    const form = document.getElementById('c_form')
    c_value = [
        parseFloat(form.elements["real"].value),
        parseFloat(form.elements["imag"].value)
    ];
    plot_julia();
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
    btn = document.getElementById("c_lock_btn");
    if (c_locked) {
        btn.innerHTML = "Lock";
        c_locked = false;
    } else {
        btn.innerHTML = "Unlock";
        c_locked = true;
    }
}

function reset_mandelbrot() {
    mandelbrot_domain = [[-2, 2], [-2, 2]];
    plot_mandelbrot();
    draw_pointers();
}

function reset_julia() {
    julia_domain = [[-2, 2], [-2, 2]];
    plot_julia();
    draw_pointers();
}

function reset() {
    z_value = [0,0];
    c_value = [0,0];
    reset_mandelbrot();
    reset_julia();
}

function update_fractal_type() {
    current_fractal = document.getElementById('fractal_type').value;
    plot();
}

function update_cmap() {
    cmap = document.getElementById('cmap').value;
    plot();
}

document.getElementById("esc_time_slider").addEventListener('change', function() {
    document.getElementById("esc_time_indicator").innerHTML = max_iterations = this.value;
    plot();
});

let play_speed = 500;

document.getElementById("play_speed_slider").addEventListener('change', function() {
    document.getElementById("play_speed_indicator").innerHTML = play_speed = this.value;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = setInterval(iterate, play_speed);
    }
});

function iterate() {
    z_value = fractal_types[current_fractal].fc(z_value,c_value);
    draw_pointers();
}

let intervalId = null;

function toggle_iteration() {
    btn = document.getElementById("iteration_toggle");
    if (intervalId===null) {
        intervalId = setInterval(iterate, play_speed);
        btn.innerHTML = "Pause";
    } else {
        clearInterval(intervalId);
        intervalId = null;
        btn.innerHTML = "Play"
    }
}

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
    mandelbrot_domain = scale(mandelbrot_domain, factor, c_value);
    plot_mandelbrot();
    draw_pointer(c_value, mandelbrot_overlay, mandelbrot_domain);
}

function scale_julia(factor) {
    julia_domain = scale(julia_domain, factor, z_value);
    plot_julia();
    draw_pointer(z_value, julia_overlay, julia_domain);
}

// event listeners

mandelbrot_canvas.addEventListener('click', (event) => {
    if (!c_locked) toggle_c_lock();
    const rect = mandelbrot_canvas.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    c_value = value(point,mandelbrot_domain);
    plot_julia();
    draw_pointers();
});

julia_canvas.addEventListener('click', (event) => {
    const rect = julia_canvas.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    z_value = value(point,julia_domain)
    draw_pointers();
});

function play() {
    document.setInterval(iterate,10);
}

const key_actions = {
    'r': reset,
    'z': () => scale_mandelbrot(0.5),
    'x': () => scale_mandelbrot(2),
    'q': () => scale_julia(0.5),
    'w': () => scale_julia(2),
    'i': iterate,
    'p': toggle_iteration,
    'l':toggle_c_lock
};

document.addEventListener('keydown', (e) => {
    if (e.key in key_actions) key_actions[e.key]();
});

["gesturestart", "gesturechange"].forEach(evt =>
    mandelbrot_canvas.addEventListener(evt, e => e.preventDefault(), {passive: false})
);

mandelbrot_canvas.addEventListener('gestureend', (e) => {
    e.preventDefault();
    if(e.scale > 1.0) scale_mandelbrot(0.5);
    else if (e.scale < 1.0) scale_mandelbrot(2);
}, {passive: false});

["gesturestart", "gesturechange"].forEach(evt =>
    julia_canvas.addEventListener(evt, e => e.preventDefault(), {passive: false})
);

julia_canvas.addEventListener('gestureend', (e) => {
    e.preventDefault();
    if(e.scale > 1.0) scale_julia(0.5);
    else if (e.scale < 1.0) scale_julia(2);
}, {passive: false});

let animationFrameRequested = false;

mandelbrot_canvas.addEventListener('pointermove', (event) => {
  if (!c_locked) {
    latestMouseEvent = event;
    if (!animationFrameRequested) {
      animationFrameRequested = true;
      requestAnimationFrame(() => {
        animationFrameRequested = false;
        const rect = mandelbrot_canvas.getBoundingClientRect();
        const point = [latestMouseEvent.clientX - rect.left, latestMouseEvent.clientY - rect.top];
        c_value = value(point, mandelbrot_domain);
        plot_julia();
        draw_pointers();
      });
    }
  }
});