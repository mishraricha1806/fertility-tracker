const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const colors = {
  cream: [255, 248, 243, 255],
  coral: [197, 83, 75, 255],
  coralSoft: [252, 232, 229, 255],
  green: [49, 105, 96, 255],
  greenSoft: [224, 240, 237, 255],
  charcoal: [55, 49, 46, 255],
  gold: [209, 149, 25, 255],
  white: [255, 255, 255, 255],
};

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return;
  }
  const index = (png.width * y + x) << 2;
  png.data[index] = color[0];
  png.data[index + 1] = color[1];
  png.data[index + 2] = color[2];
  png.data[index + 3] = color[3];
}

function fill(png, color) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      setPixel(png, x, y, color);
    }
  }
}

function circle(png, cx, cy, radius, color) {
  const radiusSquared = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(png, x, y, color);
      }
    }
  }
}

function roundedRect(png, left, top, width, height, radius, color) {
  const right = left + width;
  const bottom = top + height;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const nearLeft = x < left + radius;
      const nearRight = x >= right - radius;
      const nearTop = y < top + radius;
      const nearBottom = y >= bottom - radius;
      let inside = true;

      if (nearLeft && nearTop) {
        inside = (x - left - radius) ** 2 + (y - top - radius) ** 2 <= radius ** 2;
      } else if (nearRight && nearTop) {
        inside = (x - right + radius) ** 2 + (y - top - radius) ** 2 <= radius ** 2;
      } else if (nearLeft && nearBottom) {
        inside = (x - left - radius) ** 2 + (y - bottom + radius) ** 2 <= radius ** 2;
      } else if (nearRight && nearBottom) {
        inside = (x - right + radius) ** 2 + (y - bottom + radius) ** 2 <= radius ** 2;
      }

      if (inside) {
        setPixel(png, x, y, color);
      }
    }
  }
}

function line(png, x0, y0, x1, y1, thickness, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    circle(png, x0 + dx * t, y0 + dy * t, thickness, color);
  }
}

function drawMark(png, scale, offsetX, offsetY) {
  roundedRect(png, offsetX + scale * 128, offsetY + scale * 152, scale * 768, scale * 720, scale * 144, colors.white);
  circle(png, offsetX + scale * 512, offsetY + scale * 432, scale * 184, colors.greenSoft);
  circle(png, offsetX + scale * 512, offsetY + scale * 432, scale * 118, colors.green);
  circle(png, offsetX + scale * 512, offsetY + scale * 432, scale * 48, colors.white);
  line(png, offsetX + scale * 512, offsetY + scale * 553, offsetX + scale * 512, offsetY + scale * 704, scale * 24, colors.green);
  line(png, offsetX + scale * 421, offsetY + scale * 620, offsetX + scale * 603, offsetY + scale * 620, scale * 22, colors.green);
  circle(png, offsetX + scale * 309, offsetY + scale * 285, scale * 74, colors.coral);
  circle(png, offsetX + scale * 715, offsetY + scale * 648, scale * 64, colors.gold);
  line(png, offsetX + scale * 292, offsetY + scale * 736, offsetX + scale * 737, offsetY + scale * 736, scale * 12, colors.coralSoft);
}

function writePng(name, width, height, draw) {
  const png = new PNG({ width, height });
  fill(png, colors.cream);
  draw(png);
  fs.writeFileSync(path.join(assetsDir, name), PNG.sync.write(png));
}

writePng('icon.png', 1024, 1024, (png) => drawMark(png, 1, 0, 0));
writePng('adaptive-icon.png', 1024, 1024, (png) => drawMark(png, 1, 0, 0));
writePng('splash.png', 1284, 2778, (png) => {
  drawMark(png, 0.58, 347, 923);
  roundedRect(png, 411, 1758, 462, 18, 9, colors.coral);
  roundedRect(png, 461, 1810, 362, 14, 7, colors.green);
});
writePng('favicon.png', 48, 48, (png) => {
  circle(png, 24, 22, 15, colors.green);
  circle(png, 24, 22, 6, colors.white);
  line(png, 24, 31, 24, 41, 2, colors.green);
  line(png, 17, 36, 31, 36, 2, colors.green);
  circle(png, 13, 12, 5, colors.coral);
});

console.log('Generated app store assets in assets/');
