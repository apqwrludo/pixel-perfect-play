import { useMemo } from "react";
import * as THREE from "three";
import { Sky } from "@react-three/drei";
import { ARENA, OBSTACLES } from "./world";

/** ساحة معبد شرقي وقت الغروب — رمال، أعمدة، صناديق ذخيرة، فوانيس */
export function Arena() {
  const sandTexture = useMemo(() => makeSandTexture(), []);

  return (
    <group>
      <Sky
        sunPosition={[60, 8, -40]}
        turbidity={8}
        rayleigh={2.5}
        mieCoefficient={0.02}
        mieDirectionalG={0.9}
      />
      <fog attach="fog" args={["#e8722a", 55, 160]} />

      <hemisphereLight args={["#f5c96b", "#1a0e0a", 0.55]} />
      <directionalLight
        position={[50, 25, -30]}
        intensity={1.6}
        color="#ffb347"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      {/* الأرضية الرملية */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ARENA * 2 + 8, ARENA * 2 + 8]} />
        <meshStandardMaterial map={sandTexture} color="#d9b980" roughness={1} />
      </mesh>
      {/* أرضية بعيدة */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#a9805a" roughness={1} />
      </mesh>

      {/* العوائق */}
      {OBSTACLES.map((o, i) => {
        const isWall = o.h >= 5 && (o.hx > 10 || o.hz > 10);
        const isColumn = o.h >= 7;
        return (
          <mesh
            key={i}
            position={[o.x, o.h / 2, o.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[o.hx * 2, o.h, o.hz * 2]} />
            <meshStandardMaterial
              color={isWall ? "#8b6f4e" : isColumn ? "#c9a86a" : o.h < 2 ? "#6b4f2e" : "#b08d55"}
              roughness={0.9}
            />
          </mesh>
        );
      })}

      {/* قواعد الأعمدة المزخرفة */}
      {OBSTACLES.filter((o) => o.h >= 7).map((o, i) => (
        <mesh key={`cap-${i}`} position={[o.x, o.h + 0.25, o.z]} castShadow>
          <boxGeometry args={[o.hx * 2 + 0.6, 0.5, o.hz * 2 + 0.6]} />
          <meshStandardMaterial color="#e0be7e" roughness={0.8} />
        </mesh>
      ))}

      {/* فوانيس متوهجة */}
      {[[-24, -20], [24, 20], [-24, 20], [24, -20], [0, -10], [0, 10]].map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 2.8, 6]} />
            <meshStandardMaterial color="#3d2b1a" />
          </mesh>
          <mesh position={[0, 2.9, 0]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial
              color="#ffcc66"
              emissive="#ff9933"
              emissiveIntensity={2.4}
            />
          </mesh>
          <pointLight position={[0, 3, 0]} intensity={6} distance={14} color="#ff9a3d" />
        </group>
      ))}

      {/* بوابات الفريقين */}
      <TeamGate team="red" />
      <TeamGate team="blue" />
    </group>
  );
}

function TeamGate({ team }: { team: "red" | "blue" }) {
  const z = team === "red" ? ARENA + 0.4 : -ARENA - 0.4;
  const color = team === "red" ? "#e74c3c" : "#3498db";
  return (
    <group position={[0, 0, z]}>
      {[-6, 6].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]} castShadow>
          <boxGeometry args={[1, 5, 1]} />
          <meshStandardMaterial color="#a98548" />
        </mesh>
      ))}
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[14, 0.8, 1.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function makeSandTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#d9b980";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 170 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v}, ${v - 30}, ${v - 70}, 0.25)`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}
