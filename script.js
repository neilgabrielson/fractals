// script.js

const resolution = 400;
const mandelbrotCanvas = document.getElementById('mandelbrot');

mandelbrotCanvas.width = resolution;
mandelbrotCanvas.height = resolution;

const ctx = mandelbrotCanvas.getContext('2d');
const imageData = ctx.createImageData(mandelbrotCanvas.width, mandelbrotCanvas.height);
const pixels = imageData.data;

const fc = (z, c) => [z[0]**2-z[1]**2+c[0], 2*z[0]*z[1]+c[1]];
const norm_sq = z => z[0]**2 + z[1]**2;

var L = [[-2,2],[-2,2]]

function escape_time(c) {
    let z = [0,0];
    for (let n = 1; n < 100; n++) {
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

function plot_mandelbrot(domain, pointer) {
    for (let r = 0; r < resolution; r++) {
        for (let i = 0; i < resolution; i++) {
            if (r === pointer[0] && i === pointer[1]) setPixel(r, i, 255, 0, 0)
            else {
                const iterations = escape_time([
                    r / resolution * (domain[0][1]-domain[0][0]) + domain[0][0],
                    i / resolution * (domain[1][1]-domain[1][0]) + domain[1][0]
                ]);
                const color = iterations === 0 ? [0,0,0] : colormap(iterations/100);
                setPixel(r, i, color[0], color[1], color[2]);
            }
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

plot_mandelbrot([[-2,2],[-2,2]], [100,100])

mandelbrotCanvas.addEventListener('click', (event) => {
    const rect = mandelbrotCanvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const pr = pixelX / resolution * (L[0][1]-L[0][0]) + L[0][0];
    const pi = pixelY / resolution * (L[1][1]-L[1][0]) + L[1][0];
    L = scale(L,0.5,[pr,pi])
    plot_mandelbrot(L, [Math.round(pixelX),Math.round(pixelY)])
});