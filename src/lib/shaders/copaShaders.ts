
export const vertexShaderSource = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform float uSpeed;
  uniform float uIntensity;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    fp = fp * fp * (3.0 - 2.0 * fp);
    
    float a = hash(ip);
    float b = hash(ip + vec2(1.0, 0.0));
    float c = hash(ip + vec2(0.0, 1.0));
    float d = hash(ip + vec2(1.0, 1.0));
    
    return mix(mix(a, b, fp.x), mix(c, d, fp.x), fp.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    float time = iTime * uSpeed;

    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + time * 0.1),
      fbm(p + vec2(2.4, 5.2) + time * 0.08)
    );

    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) - time * 0.15),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.12)
    );

    float f = fbm(p + 4.0 * r);

    vec3 colorDarkGreen = vec3(0.003, 0.05, 0.012);  
    vec3 colorEmerald = vec3(0.008, 0.15, 0.06);    
    vec3 colorGold = vec3(0.35, 0.22, 0.02);       
    vec3 colorBlue = vec3(0.01, 0.03, 0.14);       

    vec3 col = mix(colorDarkGreen, colorEmerald, f);
    col = mix(col, colorBlue, length(q) * 0.5);
    col = mix(col, colorGold, r.y * 0.65);

    float highlight = smoothstep(0.45, 0.8, f * length(r));
    col += vec3(0.12, 0.09, 0.01) * highlight;

    vec2 lightPos = vec2(0.0, 1.2);
    float lightDistance = length(p - lightPos);
    float lightGlow = smoothstep(1.8, 0.0, lightDistance);
    col += vec3(0.32, 0.25, 0.04) * lightGlow * 0.15;

    col *= uIntensity;

    gl_FragColor = vec4(col, 1.0);
  }
`;
