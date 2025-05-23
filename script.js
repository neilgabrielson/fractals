// script.js

const resolution = 400;
const iterations = 500;

const mandelbrotCanvas = document.getElementById('mandelbrot');
const juliaCanvas = document.getElementById('julia');

mandelbrotCanvas.width = resolution;
mandelbrotCanvas.height = resolution;
juliaCanvas.width = resolution;
juliaCanvas.height = resolution;

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

function setPixel(x, y, r, g, b) {
    const index = (y * resolution + x) * 4;
    pixels[index] = r;       // Red
    pixels[index + 1] = g;   // Green  
    pixels[index + 2] = b;   // Blue
    pixels[index + 3] = 255; // Alpha
}

function colormap(x) {
    x *= 255;
    return [x,x,255-x]
}

function plot_mandelbrot(canvas, domain) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;
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
            pixels[index] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
            pixels[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function plot_julia(canvas, domain, z) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;
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
            pixels[index] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
            pixels[index + 3] = 255;
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

plot_mandelbrot(mandelbrotCanvas, mandelbrotDomain)
plot_julia(juliaCanvas, mandelbrotDomain, [0,0.5])

mandelbrotCanvas.addEventListener('click', (event) => {
    const rect = mandelbrotCanvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const pr = pixelX / resolution * (mandelbrotDomain[0][1]-mandelbrotDomain[0][0]) + mandelbrotDomain[0][0];
    const pi = pixelY / resolution * (mandelbrotDomain[1][1]-mandelbrotDomain[1][0]) + mandelbrotDomain[1][0];
    // mandelbrotDomain = scale(mandelbrotDomain,0.5,[pr,pi])
    // plot_mandelbrot(mandelbrotCanvas, mandelbrotDomain)
    plot_julia(juliaCanvas, mandelbrotDomain, [pr,pi])
});