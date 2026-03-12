import { useMemo } from "react";

export interface SceneNode {
  id: string;
  title: string;
  x: number;
  y: number;
  isActive: boolean;
  isVisited: boolean;
  hasNotes: boolean;
  choices: Array<{
    id: string;
    label: string;
    targetId: string;
    intent?: string;
  }>;
}

export interface SceneEdge {
  from: string;
  to: string;
  label: string;
  intent?: string;
}

interface SceneChoice {
  id: string;
  label: string;
  targetType: string;
  targetId: string;
  intent?: string;
}

interface Scene {
  id: string;
  title?: string;
  liveNotes?: unknown[];
  choices?: SceneChoice[];
}

export const NODE_W = 65;
export const NODE_H = 30;
const H_GAP = 60;
const V_GAP = 70;

export function useSceneMapLayout(
  scenes: Scene[],
  selectedSceneId: string | null,
  visitedSceneIds: Set<string>,
  overrides: Record<string, { x: number; y: number }>,
) {
  return useMemo(() => {
    if (!scenes.length) return { nodes: [], edges: [] };

    const sceneIds = new Set(scenes.map((s) => s.id));
    const edges: SceneEdge[] = [];
    const childrenOf: Record<string, string[]> = {};

    for (const scene of scenes) {
      childrenOf[scene.id] = [];
    }

    // Connexions scène->scène : targetId doit être l'id d'une scène connue
    for (const scene of scenes) {
      for (const choice of scene.choices ?? []) {
        if (!sceneIds.has(choice.targetId)) continue;
        if (choice.targetId === scene.id) continue;
        edges.push({
          from: scene.id,
          to: choice.targetId,
          label: choice.label,
          intent: choice.intent,
        });
        if (!childrenOf[scene.id].includes(choice.targetId)) {
          childrenOf[scene.id].push(choice.targetId);
        }
      }
    }

    const positions: Record<string, { x: number; y: number }> = {};
    const placed = new Set<string>();
    const usedCells = new Set<string>();

    function findFreeCol(row: number, preferredCol: number): number {
      let col = preferredCol;
      while (usedCells.has(`${col},${row}`)) col++;
      return col;
    }

    // BFS depuis la 1ère scène
    const queue: Array<{ id: string; col: number; row: number }> = [
      { id: scenes[0].id, col: 0, row: 0 },
    ];

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (placed.has(item.id)) continue;

      const col = findFreeCol(item.row, item.col);
      usedCells.add(`${col},${item.row}`);
      placed.add(item.id);
      positions[item.id] = {
        x: col * (NODE_W + H_GAP) + 40,
        y: item.row * (NODE_H + V_GAP) + 40,
      };

      const children = childrenOf[item.id] ?? [];
      children.forEach((childId, i) => {
        if (!placed.has(childId)) {
          queue.push({ id: childId, col: col + i, row: item.row + 1 });
        }
      });
    }

    // Scènes orphelines (non atteintes par le BFS) — placement en grille
    let oCol = 0;
    let oRow = 0;
    for (const scene of scenes) {
      if (placed.has(scene.id)) continue;
      while (usedCells.has(`${oCol},${oRow}`)) {
        oCol++;
        if (oCol > 4) { oCol = 0; oRow++; }
      }
      usedCells.add(`${oCol},${oRow}`);
      placed.add(scene.id);
      positions[scene.id] = {
        x: oCol * (NODE_W + H_GAP) + 40,
        y: oRow * (NODE_H + V_GAP) + 40,
      };
      oCol++;
    }

    const nodes: SceneNode[] = scenes.map((scene) => {
      const base = positions[scene.id] ?? { x: 40, y: 40 };
      const pos = overrides[scene.id] ?? base;
      return {
        id: scene.id,
        title: scene.title?.trim() || "Scène sans titre",
        x: pos.x,
        y: pos.y,
        isActive: scene.id === selectedSceneId,
        isVisited: visitedSceneIds.has(scene.id),
        hasNotes: (scene.liveNotes?.length ?? 0) > 0,
        choices: (scene.choices ?? [])
          .filter((c) => sceneIds.has(c.targetId) && c.targetId !== scene.id)
          .map((c) => ({
            id: c.id,
            label: c.label,
            targetId: c.targetId,
            intent: c.intent,
          })),
      };
    });

    return { nodes, edges };
  }, [scenes, selectedSceneId, visitedSceneIds, overrides]);
}
