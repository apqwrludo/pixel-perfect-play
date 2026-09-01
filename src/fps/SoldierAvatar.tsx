import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import type { Fighter } from "./world";
import { TEAM_COLOR, world } from "./world";

useGLTF.preload("/models/soldier.glb");

const DEAD_TILT = Math.PI / 2;

/** جندي ثلاثي الأبعاد بنموذج CC0 (ثلاث حركات: وقوف/مشي/جري) مع صبغة لون الفريق */
export function SoldierAvatar({ fighterId }: { fighterId: string }) {
  const { scene, animations } = useGLTF("/models/soldier.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned]);
  const actions = useMemo(() => {
    const find = (n: string) => animations.find((a) => a.name === n);
    const idle = find("Idle");
    const walk = find("Walk");
    const run = find("Run");
    return {
      idle: idle ? mixer.clipAction(idle) : null,
      walk: walk ? mixer.clipAction(walk) : null,
      run: run ? mixer.clipAction(run) : null,
      current: null as THREE.AnimationAction | null,
    };
  }, [animations, mixer]);

  const f = world.fighters.get(fighterId);
  const tint = f ? TEAM_COLOR[f.team] : "#888";

  useEffect(() => {
    const fighter = world.fighters.get(fighterId);
    cloned.traverse((obj) => {
      if (obj instanceof THREE.SkinnedMesh || obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.frustumCulled = false;
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && fighter) {
          const m = mat.clone();
          // صبغة لون الفريق على الجسم
          m.color = new THREE.Color(TEAM_COLOR[fighter.team]).lerp(new THREE.Color("#ffffff"), 0.55);
          (obj as THREE.Mesh).material = m;
        }
      }
    });
  }, [cloned, fighterId]);

  useEffect(() => {
    actions.idle?.play();
    actions.current = actions.idle;
    return () => {
      mixer.stopAllAction();
    };
  }, [actions, mixer]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const fighter = world.fighters.get(fighterId);
    const g = group.current;
    if (!fighter || !g) return;

    g.position.copy(fighter.pos);
    g.rotation.y = fighter.yaw;

    // سقوط عند الموت
    const targetTilt = fighter.alive ? 0 : DEAD_TILT;
    g.rotation.x += (targetTilt - g.rotation.x) * (1 - Math.exp(-8 * delta));

    // تبديل حركة مشي/وقوف
    const want = fighter.moving ? actions.run ?? actions.walk : actions.idle;
    if (want && actions.current !== want) {
      actions.current?.fadeOut(0.15);
      want.reset().fadeIn(0.15).play();
      actions.current = want;
    }
    mixer.update(delta);
  });

  return (
    <group ref={group}>
      <primitive object={cloned} />
      {/* شريط صحة صغير فوق الرأس */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color={tint} />
      </mesh>
    </group>
  );
}
