// shaders.js

const gl = canvases.mandelbrot.getContext('webgl');

const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, `

    #ifdef GL_ES
    precision highp float;
    #endif

    // uniforms
    uniform int u_max_iterations;

    // fractal functions
    vec2 mandlebrot(vec2 z, vec2 c) {
        return vec2(z[0]**2 - z[1]**2 + c[0],2*z[0]*z[1] + c[1]);
    }

    attribute vec4 p;

    void main(){
        gl_Position=p;
    }
        
`);
gl.compileShader(vs);

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, `
    void main(){
        gl_FragColor=vec4(1,0,0,1);
    }
`);
gl.compileShader(fs);

const prog = gl.createProgram();
gl.attachShader(prog, vs);
gl.attachShader(prog, fs);
gl.linkProgram(prog);
gl.useProgram(prog);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);
gl.drawArrays(gl.TRIANGLES, 0, 6);