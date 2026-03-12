import { useMemo } from "react";

export interface SceneNode {
  id: string;
  title: string;
  col: number;
  row: number;
  isActive: boolean;
  isVisited: boolean;
  hasNotes: boolean;
}

export interface SceneEdge {
  from: string;
  to: string;
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

// Taille d'une case de la grille (style Dofus)
export const CELL_SIZE = 56;
export const CELL_GAP = 4;

export function useSceneMapLayout(
  scenes: Scene[],
  selectedSceneId: string | null,
  visitedSceneIds: Set<string>,
  // gridOverrides : position col/row manuelle par scène
  gridOverrides: Record<string, { col: number; row: number }>,
) {
  return useMemo(() => {
    if (!scenes.length) return { nodes: [], edges: [] };

    const sceneIds = new Set(scenes.map((s) => s.id));
    const edges: SceneEdge[] = [];
    const edgeSet = new Set<string>();

    // Construire les connexions scène→scène
    // On ignore targetType et on se base uniquement sur targetId
    // pour être tolérant quelle que soit la valeur stockée ("scene", "Scene", etc.)
    for (const scene of scenes) {
      for (const choice of scene.choices ?? []) {
        if (!choice.targetId) continue;
        if (!sceneIds.has(choice.targetId)) continue;
        if (choice.targetId === scene.id) continue;
        const key = [scene.id, choice.targetId].sort().join("|");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ from: scene.id, to: choice.targetId });
        }
      }
    }

    // Placement en grille BFS si pas d'override
    const positions: Record<string, { col: number; row: number }> = {};
    const placed = new Set<string>();
    const usedCells = new Set<string>();

    const childrenOf: Record<string, string[]> = {};
    for (const scene of scenes) childrenOf[scene.id] = [];
    for (const scene of scenes) {
      for (const choice of scene.choices ?? []) {
        if (!choice.targetId) continue;
        if (!sceneIds.has(choice.targetId)) continue;
        if (choice.targetId === scene.id) continue;
        if (!childrenOf[scene.id].includes(choice.targetId))
          childrenOf[scene.id].push(choice.targetId);
      }
    }

    function cellKey(col: number, row: number) { return `${col},${row}`; }

    function findFreeCell(preferredCol: number, row: number) {
      let col = preferredCol;
      while (usedCells.has(cellKey(col, row))) col++;
      return col;
    }

    const queue: Array<{ id: string; col: number; row: number }> = [
      { id: scenes[0].id, col: 0, row: 0 },
    ];

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (placed.has(item.id)) continue;
      const col = findFreeCell(item.col, item.row);
      usedCells.add(cellKey(col, item.row));
      placed.add(item.id);
      positions[item.id] = { col, row: item.row };
      const children = childrenOf[item.id] ?? [];
      children.forEach((childId, i) => {
        if (!placed.has(childId))
          queue.push({ id: childId, col: col + i, row: item.row + 1 });
      });
    }

    // Orphelins
    let oCol = 0, oRow = 0;
    for (const scene of scenes) {
      if (placed.has(scene.id)) continue;
      while (usedCells.has(cellKey(oCol, oRow))) {
        oCol++;
        if (oCol > 5) { oCol = 0; oRow++; }
      }
      usedCells.add(cellKey(oCol, oRow));
      placed.add(scene.id);
      positions[scene.id] = { col: oCol, row: oRow };
      oCol++;
    }

    const nodes: SceneNode[] = scenes.map((scene) => {
      const base = positions[scene.id] ?? { col: 0, row: 0 };
      const pos = gridOverrides[scene.id] ?? base;
      return {
        id: scene.id,
        title: scene.title?.trim() || "?",
        col: pos.col,
        row: pos.row,
        isActive: scene.id === selectedSceneId,
        isVisited: visitedSceneIds.has(scene.id),
        hasNotes: (scene.liveNotes?.length ?? 0) > 0,
      };
    });

    return { nodes, edges };
  }, [scenes, selectedSceneId, visitedSceneIds, gridOverrides]);
}
