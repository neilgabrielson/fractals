// script.js

const resolution = 400;
const iterations = 500;

const mandelbrotCanvas = document.getElementById('mandelbrot');
const juliaCanvas = document.getElementById('julia');

const mandelbrotOverlay = document.getElementById('mandelbrot-overlay');
const juliaOverlay = document.getElementById('julia-overlay');

mandelbrotCanvas.width = resolution;
mandelbrotCanvas.height = resolution;
mandelbrotOverlay.width = resolution;
mandelbrotOverlay.height = resolution;
juliaCanvas.width = resolution;
juliaCanvas.height = resolution;
juliaOverlay.width = resolution;
juliaOverlay.height = resolution;

const fc = (z, c) => [z[0]**2-z[1]**2+c[0], 2*z[0]*z[1]+c[1]];
const norm_sq = z => z[0]**2 + z[1]**2;

var mandelbrotDomain = [[-2,2],[-2,2]]

function escape_time(z, c) {
    for (let n = 1; n < iterations; n++) {
        z = fc(z,c);
        if (norm_sq(z) >= 4) return n;
    }
    return 0;
}

const to_coord = (p, domain, canvas) => [
    p[0] / canvas.width * (domain[0][1]-domain[0][0]) + domain[0][0],
    p[1] / canvas.height * (domain[1][1]-domain[1][0]) + domain[1][0]
];

const to_pixel = (z, domain, canvas) => [
    (z[0]-domain[0][0]) / (domain[0][1]-domain[0][0]) * canvas.width,
    (z[1]-domain[1][0]) / (domain[1][1]-domain[1][0]) * canvas.height
];

function drawPointer(canvas, coords, color='red',size=8) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Draw crosshair
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

drawPointer(mandelbrotOverlay, [100,100])

function colormap(x) {
    x *= 255;
    return [x,x,255-x]
}

function plot_mandelbrot(canvas, domain) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const it = escape_time(
                [0,0],
                [
                    x / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
                    y / resolution * (domain[1][1]-domain[1][0]) + domain[1][0]
                ]
            );
            const color = it === 0 ? [0,0,0] : colormap(it/100);
            const index = (y * canvas.width + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function plot_julia(canvas, domain, z) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const it = escape_time(
                [
                    x / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
                    y / resolution * (domain[1][1]-domain[1][0]) + domain[1][0]
                ],
                [
                    z[0],
                    z[1]
                ]
            );
            const color = it === 0 ? [0,0,0] : colormap(it/100);
            const index = (y * canvas.width + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

const scale = (domain, factor, p) => 
    [
        [
            p[0] - (domain[0][1] - domain[0][0]) * factor / 2,
            p[0] + (domain[0][1] - domain[0][0]) * factor / 2
        ],
        [
            p[1] - (domain[1][1] - domain[1][0]) * factor / 2,
            p[1] + (domain[1][1] - domain[1][0]) * factor / 2
        ]
    ];

plot_mandelbrot(mandelbrotCanvas, mandelbrotDomain);
drawPointer(mandelbrotOverlay, to_pixel([0,0], mandelbrotDomain, mandelbrotOverlay));
plot_julia(juliaCanvas, mandelbrotDomain, [0,0]);

mandelbrotCanvas.addEventListener('click', (event) => {
    const rect = mandelbrotCanvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    plot_julia(juliaCanvas, mandelbrotDomain, to_coord([pixelX,pixelY],mandelbrotDomain,juliaCanvas));
    drawPointer(mandelbrotOverlay, [pixelX,pixelY])
});

juliaCanvas.addEventListener('click', (event) => {
    const rect = juliaCanvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    drawPointer(juliaOverlay, [pixelX,pixelY])
});

document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'r':
            mandelbrotDomain = [[-2, 2], [-2, 2]];
            plot_mandelbrot(mandelbrotCanvas, mandelbrotDomain);
            break;   
        case 'i':
            console.log('i');
            break;
    }
});