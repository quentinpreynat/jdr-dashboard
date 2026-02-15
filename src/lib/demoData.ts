import type { AppData } from "../models";

export const DEMO_DATA: AppData = {
  campaign: {
    id: "campaign_main",
    title: "Ombres sur la Grande Route",
    summary:
      "Un trouble grandissant autour de la Grande Route de l'Est-Ouest, où les marchands disparaissent et où d'anciennes rumeurs ressurgissent.",
    tone: "Voyage méfiant, vieilles chansons, sourde inquiétude.",
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-10T18:30:00.000Z"
  },
  sessions: [
    {
      id: "session_1",
      title: "À l'Auberge Abandonnée",
      objective: "Découvrir qui a vu la dernière caravane en vie.",
      notes: "Donner à chaque joueur une rumeur liée à son historique.",
      scenes: [
        {
          id: "scene_1",
          title: "Pluie au crépuscule",
          text: "L'auberge est bondée, boueuse et tendue après le coucher du soleil.",
          order: 1,
          linkedNpcIds: []
        },
        {
          id: "scene_2",
          title: "Une carte déchirée",
          text: "Un colporteur ivre vend une carte avec un cercle marqué.",
          order: 2,
          linkedNpcIds: []
        }
      ],
      inTimeline: true,
      timelineOrder: 1,
      createdAt: "2026-02-02T17:00:00.000Z",
      updatedAt: "2026-02-12T09:15:00.000Z"
    },
    {
      id: "session_2",
      title: "Les Feux de la Tour",
      objective: "Identifier la source des lueurs nocturnes près de la vieille tour.",
      notes: "Introduire un guide local réticent mais bien informé.",
      scenes: [
        {
          id: "scene_3",
          title: "Piste dans la brume",
          text: "Des traces fraîches traversent un vallon noyé de brouillard.",
          order: 1,
          linkedNpcIds: []
        },
        {
          id: "scene_4",
          title: "La tour silencieuse",
          text: "La pierre suinte d'humidité et un feu froid palpite au sommet.",
          order: 2,
          linkedNpcIds: []
        }
      ],
      inTimeline: true,
      timelineOrder: 2,
      createdAt: "2026-02-05T14:20:00.000Z",
      updatedAt: "2026-02-14T20:05:00.000Z"
    }
  ],
  npcs: [
    {
      id: "npc_1",
      name: "Brandulf",
      role: "Aubergiste",
      locationText: "Auberge Abandonnée",
      description: "Breeois aux épaules larges, au sourire prudent.",
      notes: "Cache une lettre du dernier garde de la caravane.",
      attitude: "neutral",
      createdAt: "2026-02-01T09:10:00.000Z",
      updatedAt: "2026-02-11T08:45:00.000Z"
    },
    {
      id: "npc_2",
      name: "Elenir",
      role: "Rôdeuse",
      locationText: "Lisière de la forêt",
      description: "Silencieuse, attentive, toujours en avance d'un pas.",
      notes: "Sait interpréter les signes laissés par les Wargs.",
      attitude: "wary",
      createdAt: "2026-02-03T12:00:00.000Z",
      updatedAt: "2026-02-13T16:20:00.000Z"
    },
    {
      id: "npc_3",
      name: "Haldor",
      role: "Marchand",
      locationText: "Route de l'Est",
      description: "Parle vite, compte encore plus vite.",
      notes: "A perdu une cargaison entière il y a une semaine.",
      attitude: "friendly",
      createdAt: "2026-02-04T18:30:00.000Z",
      updatedAt: "2026-02-14T11:40:00.000Z"
    }
  ]
};

export function cloneDemoData(): AppData {
  return JSON.parse(JSON.stringify(DEMO_DATA)) as AppData;
}




