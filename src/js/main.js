// import '../css/style.scss';
// import { radian, random } from './utils';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { gsap } from "gsap";

class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector("#canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);

    this.scene = new THREE.Scene();
    this.camera = null;
    this.mesh = null;

    this.countParticle = 3000;

    this.randomMesh = null;

    this.surfaceMesh = null;

    this.controls = null;

    this._init();
    this._update();
    this._addEvent();
  }

  _setCamera() {
    // this.camera = new THREE.PerspectiveCamera(45, this.viewport.width / this.viewport.height, 1, 100);
    // this.camera.position.set(0, 0, 5);
    // this.scene.add(this.camera);

    //ウインドウとWebGL座標を一致させる
    const fov = 45;
    const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    const distance = this.viewport.height / 2 / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.viewport.width / this.viewport.height,
      1,
      distance * 2
    );
    this.camera.position.z = distance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _setControlls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  _addMesh() {
    // const geometry = new THREE.BoxGeometry(100, 100, 100);
    const geometry = new THREE.IcosahedronGeometry(150, 5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      wireframe: true
    });
    this.mesh = new THREE.Mesh(geometry, material);

    this.particleCount = this.mesh.geometry.attributes.position.count;
    // this.scene.add(this.mesh);
  }

  _addRandomParticlesMesh() {
    const vertices = [];
    for (let i = 0; i < this.countParticle; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = (Math.random() - 0.5) * 1000;
      vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      // vertexColors: true,
      color: "red",
      size: 2.0
    });

    this.randomMesh = new THREE.Points(geometry, material);
    // this.scene.add(this.randomMesh);
  }

  _addParticlesSurface() {
    this.particleSurfaceMaterial = new THREE.PointsMaterial({
      color: 'red',
      size: 1.0
    })

    const sampler = new MeshSurfaceSampler(this.mesh).build()
    this.particleSurfaceGeometry = new THREE.BufferGeometry()
    const particlesPosition = new Float32Array(this.countParticle * 3)

    for(let i = 0; i < this.countParticle; i++) {
      const newPosition = new THREE.Vector3()
      sampler.sample(newPosition)
      particlesPosition.set([
        newPosition.x, // 0 - 3
        newPosition.y, // 1 - 4
        newPosition.z // 2 - 5
      ], i * 3)
    }

    this.particleSurfaceGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPosition, 3))

    this.particleSurfaceMesh = new THREE.Points(this.particleSurfaceGeometry, this.particleSurfaceMaterial)

    console.log(this.particleSurfaceMesh);

    // this.scene.add(this.particlesMesh);
  }

  // 頂点にパーティクルを配置
  _addParticlesMesh() {
    // this.particleGeometry = this.mesh.geometry;
    this.particleGeometry = this.randomMesh.geometry;
    this.particleMaterial = new THREE.PointsMaterial({
      color: "red",
      size: 3.0
    });
    this.particlesMesh = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.particlesMesh);
  }

  _animateParticles() {
    // const targetPositions = this.mesh.geometry.attributes.position.array;
    const targetPositions = this.particleSurfaceMesh.geometry.attributes.position.array;
    const positions = this.randomMesh.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i+=3) {
      // アニメーション用中間オブジェクト
      const intermediateObject = {
        x: positions[i],
        y: positions[i+1],
        z: positions[i+2]
      };

      gsap.to(intermediateObject, {
        duration: 1.6,
        ease: "power4.inOut",
        x: targetPositions[i],
        y: targetPositions[i+1],
        z: targetPositions[i+2],
        onUpdate: () => {
          positions[i] = intermediateObject.x;
          positions[i+1] = intermediateObject.y;
          positions[i+2] = intermediateObject.z;
          this.particlesMesh.geometry.attributes.position.needsUpdate = true;
        }
      });

      gsap.to(this.particlesMesh.rotation, {
        duration: 1.2,
        y: "+=120",
      });
    }
  }

  _init() {
    this._setCamera();
    this._setControlls();
    this._addMesh();

    this._addRandomParticlesMesh();
    this._addParticlesMesh();
    this._addParticlesSurface();
  }

  _update() {
    // this.mesh.rotation.y += 0.005;
    // this.mesh.rotation.x += 0.005;

    // this.particlesMesh.rotation.y += 0.001;
    // this.particlesMesh.rotation.x += 0.005;

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));

    window.addEventListener('load', this._animateParticles.bind(this));
  }
}

new Main();



