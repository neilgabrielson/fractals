// script.js

const resolution = 400;

const canvases = {
    mandelbrot: document.getElementById('mandelbrot'),
    mandelbrot_overlay: document.getElementById('mandelbrot-overlay'),
    julia: document.getElementById('julia'),
    julia_overlay: document.getElementById('julia-overlay')
}

Object.values(canvases).forEach(canvas => {
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
    }
}

// set initial domains
var domains = {
    mandelbrot: [[-2,2],[-2,2]],
    julia: [[-2,2],[-2,2]]
}

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

const cmap_functions = {
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

const cmaps = {
    aqua: Array.from({length: 101}, (_, i) => cmap_functions['aqua'](i)),
    dark_red: Array.from({length: 101}, (_, i) => cmap_functions['dark_red'](i)),
    viridis: Array.from({length: 101}, (_, i) => cmap_functions['aqua'](i)),
}

function plot(fracs=["julia","mandelbrot"]) {
    for (i in fracs) {
        const ctx = canvases[fracs[i]].getContext("2d");
        const imageData = ctx.createImageData(resolution, resolution);
        for (let x = 0; x < resolution; x++) {
            for (let y = 0; y < resolution; y++) {
                const iterations = fracs[i] == "julia"
                    ? escape_time(
                        value([x,y],domains["julia"]),
                        c_value
                    )
                    : fracs[i] == "mandelbrot"
                    ? escape_time(
                        [0,0],
                        value([x,y],domains["mandelbrot"])
                    )
                    : 0;
                const color = iterations === 0 ? [0,0,0] : cmaps[cmap][iterations];
                const index = (y * resolution + x) * 4;
                imageData.data[index] = color[0];
                imageData.data[index + 1] = color[1];
                imageData.data[index + 2] = color[2];
                imageData.data[index + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
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
    domains.mandelbrot = scale(domains.mandelbrot, factor, c_value);
    plot(["mandelbrot"]);
    draw_pointer(c_value, canvases.mandelbrot_overlay, domains.mandelbrot);
}

function scale_julia(factor) {
    domains.julia = scale(domains.julia, factor, z_value);
    plot(["julia"]);
    draw_pointer(z_value, canvases.julia_overlay, domains.julia);
}

// event listeners

canvases.mandelbrot.addEventListener('click', (event) => {
    if (!c_locked) toggle_c_lock();
    const rect = canvases.mandelbrot.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    c_value = value(point,domains.mandelbrot);
    plot(["julia"]);
    draw_pointers();
});

canvases.julia.addEventListener('click', (event) => {
    const rect = canvases.julia.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    z_value = value(point,domains.julia)
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

let animationFrameRequested = false;

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