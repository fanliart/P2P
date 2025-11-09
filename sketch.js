    let peer;
    let params;
    let overlayImg;
    let isPaused = false;

    const baseWidth = 800;
    const baseHeight = 1131;
    let peerRadius;
    let peerSpeed;
    let history = [];

    function preload() {
      overlayImg = loadImage("cover.png");
    }

    function setup() {
      let canvas = createCanvas(baseWidth, baseHeight);
      canvas.parent('canvas-container');

      peerRadius = min(baseWidth, baseHeight) * 0.28;
      peerSpeed = min(baseWidth, baseHeight) * 0.02;

      params = {
        backgroundColor: "#222831",
        blendMode: "SCREEN",
        color1: "#00a1b6",
        color2: "#6ab93d"
      };

      refreshSketch();
      resizeCanvasCSS();
      window.addEventListener('resize', resizeCanvasCSS);
      setupControls();
      updateColorPreviews();
    }

    function updateColorPreviews() {
      document.getElementById('color1Preview').style.backgroundColor = params.color1;
      document.getElementById('color2Preview').style.backgroundColor = params.color2;
    }

    function setupControls() {
      const toggleBtn = document.getElementById('toggleControls');
      const controls = document.querySelector('.controls');

      function adjustControlsPosition() {
        const gap = 10;
        const padding = 8;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const controlsRect = controls.getBoundingClientRect();
        const controlsH = controlsRect.height || 0;

        let centerY = winH / 2;
        let minCenter = padding + controlsH / 2;
        let maxCenter = winH - padding - controlsH / 2;
        if (centerY < minCenter) centerY = minCenter;
        if (centerY > maxCenter) centerY = maxCenter;

        controls.style.top = Math.round(centerY) + 'px';

        const tRect = toggleBtn.getBoundingClientRect();
        const desiredRight = Math.round(winW - tRect.left + gap);
        if (controls.classList.contains('expanded')) {
          controls.style.right = desiredRight + 'px';
        } else {
          controls.style.right = '-80px';
        }
      }

      toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('expanded');
        controls.classList.toggle('expanded');
        adjustControlsPosition();
      });

      window.addEventListener('resize', adjustControlsPosition);
      window.addEventListener('orientationchange', adjustControlsPosition);

      setTimeout(adjustControlsPosition, 10);

      document.getElementById('refreshBtn').addEventListener('click', refreshSketch);
      
      document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        const btn = document.getElementById('pauseBtn');

        const playSvg = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        const pauseSvg = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        const tooltipSpan = btn.querySelector('.tooltip');

        const currentSvg = btn.querySelector('svg');
        if (currentSvg) {
          currentSvg.outerHTML = isPaused ? playSvg : pauseSvg;
        }
        if (tooltipSpan) {
          tooltipSpan.textContent = isPaused ? '繼續' : '暫停';
        }
        btn.title = isPaused ? '繼續' : '暫停';
      });

      document.getElementById('randomBtn').addEventListener('click', () => {
        params.color1 = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        params.color2 = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        document.getElementById('color1').value = params.color1;
        document.getElementById('color2').value = params.color2;
        updateColorPreviews();
      });

      document.getElementById('color1').addEventListener('input', (e) => {
        params.color1 = e.target.value;
        updateColorPreviews();
      });

      document.getElementById('color2').addEventListener('input', (e) => {
        params.color2 = e.target.value;
        updateColorPreviews();
      });

      document.getElementById('shareBtn').addEventListener('click', shareCover);
    }

    function refreshSketch() {
      clear();
      background(params.backgroundColor);
      peer = createPeer(width / 2, height / 2 - 35,
        createVector(random(-peerSpeed, peerSpeed), random(-peerSpeed, peerSpeed)));
      history = [];
    }

    function resizeCanvasCSS() {
      const canvas = document.querySelector("canvas");
      const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
      canvas.style.width = baseWidth * scale + "px";
      canvas.style.height = baseHeight * scale + "px";
    }

    function draw() {
      if (isPaused) return;

      for (let i = 0; i < 10; i++) {
        newPeer(peer);
        drawPeer(peer);
      }

      blendMode(window[params.blendMode]);

      if (overlayImg) {
        push();
        blendMode(BLEND);
        image(overlayImg, 0, 0, width, height);
        pop();
      }
    }

    function createPeer(x, y, speed) {
      return {
        previousP: createVector(x, y),
        P: createVector(x, y),
        velocity: speed,
        life: 100,
        num: 0,
        color: color(0, 0, 255),
      };
    }

    function newPeer(p) {
      p.previousP = p.P.copy();
      p.P.add(p.velocity);
      p.velocity.mult(0.9);
      p.life--;

      let speedMagnitude = p.velocity.mag();
      let maxSpeed = peerSpeed;
      let minSpeed = peerSpeed * 0.01;
      let t = constrain(map(speedMagnitude, minSpeed, maxSpeed, 0, 1), 0, 1);
      p.color = lerpColor(color(params.color1), color(params.color2), t);

      let centerY = height / 2 - 35;
      let center = dist(p.P.x, p.P.y, width / 2, centerY);
      if (center > peerRadius) {
        let angle = atan2(p.P.y - centerY, p.P.x - width / 2);
        p.P.x = width / 2 + cos(angle) * peerRadius;
        p.P.y = centerY + sin(angle) * peerRadius;
      }

      if (p.life < 0 && random() < 0.05 && p.num < 2) {
        peer = createPeer(p.P.x, p.P.y,
          createVector(random(-peerSpeed, peerSpeed), random(-peerSpeed, peerSpeed)));
      }

      if (p.num == 1) {
        p.P.y += sin(p.P.x) * 4;
        p.P.x += sin(p.P.y) * 4;
      }
      if (p.num == 2) {
        p.P.x += random(random(-4, 4));
        p.P.y += random(random(-4, 4));
      }

      p.P.y += sin(p.P.x / 5);
      p.P.x += sin(p.P.y / 5);
    }

    function drawPeer(p) {
      push();
      strokeWeight(3);
      stroke(p.color.levels[0], p.color.levels[1], p.color.levels[2], 30);
      line(p.previousP.x, p.previousP.y, p.P.x, p.P.y);
      pop();

      history.push({
        prev: { x: p.previousP.x, y: p.previousP.y },
        curr: { x: p.P.x, y: p.P.y },
        color: [p.color.levels[0], p.color.levels[1], p.color.levels[2], 30]
      });
    }

    async function shareCover() {
      let timestamp = new Date();
      let formatted = "P2P_" + 
                      timestamp.getFullYear().toString().slice(2) + "." +
                      (timestamp.getMonth()+1).toString().padStart(2,'0') + "." +
                      timestamp.getDate().toString().padStart(2,'0') + "." +
                      timestamp.getHours().toString().padStart(2,'0') + "." +
                      timestamp.getMinutes().toString().padStart(2,'0') + "." +
                      timestamp.getSeconds().toString().padStart(2,'0');

      const canvas = document.querySelector('canvas');
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${formatted}.png`, { type: 'image/png' });
        const files = [file];

        if (!navigator.canShare) {
          saveCanvas(formatted, "png");
          return;
        }

        if (navigator.canShare({ files })) {
          try {
            await navigator.share({
              files,
              title: 'P2P 共享資源宣言 繁中版封面',
              text: '快來生成看看屬於自己的版本！',
            });
          } catch (error) {
            if (error.name !== 'AbortError') {
              saveCanvas(formatted, "png");
            }
          }
        } else {
          saveCanvas(formatted, "png");
        }
      }, 'image/png');
    }