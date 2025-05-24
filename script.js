// script.js

const resolution = 400;
const max_iterations = 100;

const mandelbrot_canvas = document.getElementById('mandelbrot');
const julia_canvas = document.getElementById('julia');

const mandelbrot_overlay = document.getElementById('mandelbrot-overlay');
const julia_overlay = document.getElementById('julia-overlay');

mandelbrot_canvas.width = resolution;
mandelbrot_canvas.height = resolution;
mandelbrot_overlay.width = resolution;
mandelbrot_overlay.height = resolution;
julia_canvas.width = resolution;
julia_canvas.height = resolution;
julia_overlay.width = resolution;
julia_overlay.height = resolution;

// define fc and norm squared fucntions
const fc = (z, c) => [z[0]**2-z[1]**2+c[0], 2*z[0]*z[1]+c[1]];
const norm_sq = z => z[0]**2+z[1]**2;

// set initial domains
var mandelbrot_domain = [[-2,2],[-2,2]]
var julia_domain = [[-2,2],[-2,2]]

// set z and c values
var z_value = [0,0];
var c_value = [0,0];

// define escape time function
function escape_time(z, c) {
    for (let n = 1; n < max_iterations; n++) {
        z = fc(z,c);
        if (norm_sq(z) >= 4) return n;
    }
    return 0;
}

// define pixel to complex cordinate function
const value = (point, domain) => [
    point[0] / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
    point[1] / resolution * (domain[1][1]-domain[1][0]) + domain[1][0]
];

const to_pixel = (point, domain) => [
    (point[0]-domain[0][0]) / (domain[0][1]-domain[0][0]) * resolution,
    (point[1]-domain[1][0]) / (domain[1][1]-domain[1][0]) * resolution
];

// draw pointer
function draw_pointer(point, canvas, domain, color='red',size=8) {
    const ctx = canvas.getContext('2d');
    const coords = to_pixel(point, domain);
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

function colormap(x) {
    x *= 255;
    return [x,x,255-x]
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
            const color = iterations === 0 ? [0,0,0] : colormap(iterations/max_iterations);
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
    console.log(julia_domain);
    const ctx = julia_canvas.getContext("2d");
    const imageData = ctx.createImageData(resolution, resolution);
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const iterations = escape_time(
                value([x,y],julia_domain),
                c_value
            );
            const color = iterations === 0 ? [0,0,0] : colormap(iterations/max_iterations);
            const index = (y * resolution + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
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

plot_mandelbrot();
plot_julia();
draw_pointers();

mandelbrot_canvas.addEventListener('click', (event) => {
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

function update() {
    c_value = [parseFloat(document.getElementById("c_rl").value), parseFloat(document.getElementById("c_im").value)];
    plot_julia();
    z_value = [parseFloat(document.getElementById("z_rl").value), parseFloat(document.getElementById("z_im").value)];
    draw_pointers();
}

document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'r':
            mandelbrot_domain = [[-2, 2], [-2, 2]];
            julia_domain = [[-2, 2], [-2, 2]];
            c_value = [0,0];
            z_value = [0,0];
            plot_julia();
            plot_mandelbrot();
            draw_pointers();
            break;   
        case 'z':
            mandelbrot_domain = scale(mandelbrot_domain,0.5,c_value);
            plot_mandelbrot();
            draw_pointers();
            break;
        case 'x':
            mandelbrot_domain = scale(mandelbrot_domain,2,c_value);
            plot_mandelbrot();
            draw_pointers();
            break;
        case 'q':
            julia_domain = scale(julia_domain,0.5,z_value);
            plot_julia();
            draw_pointers();
            break;
        case 'w':
            julia_domain = scale(julia_domain,2,z_value);
            plot_julia();
            draw_pointers();
            break;
        case 'i':
            z_value = fc(z_value,c_value);
            draw_pointers();
            break;
    }
});