import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { notifyPartnerCheckedIn } from "@/notifications";
import type { FlowerColorKey } from "@/hooks/use-garden-colors";

export const STAGE_NAMES = ["Seed", "Sprout", "Bud", "Blooming", "Full Bloom"];
export const STREAK_MILESTONES = [7, 30, 100];

export type Garden = {
  id: string;
  code: string;
  members: string[];
  stage: number;
  streak: number;
  lastCheckIn: Record<string, string>;
  lastSuccessDate: string | null;
  history: Record<string, Record<string, boolean>>;
  notes: Record<string, { text: string; date: string }>;
  flowerColor: FlowerColorKey;
  createdAt: unknown;
};

export type Milestone =
  | { type: "stage"; label: string }
  | { type: "streak"; value: number }
  | null;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayString(from: string) {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function normalizeGarden(id: string, data: DocumentData): Garden {
  return {
    id,
    code: data.code ?? "",
    members: data.members ?? [],
    stage: data.stage ?? 0,
    streak: data.streak ?? 0,
    lastCheckIn: data.lastCheckIn ?? {},
    lastSuccessDate: data.lastSuccessDate ?? null,
    history: data.history ?? {},
    notes: data.notes ?? {},
    flowerColor: data.flowerColor ?? "pink",
    createdAt: data.createdAt ?? null,
  };
}

export function useGarden() {
  const [loading, setLoading] = useState(true);
  const [garden, setGarden] = useState<Garden | null>(null);
  const [error, setError] = useState("");
  const [milestone, setMilestone] = useState<Milestone>(null);

  const uid = auth.currentUser?.uid ?? "";
  const prevPartnerCheckedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "gardens"), where("members", "array-contains", uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const next = normalizeGarden(docSnap.id, docSnap.data());

          const partnerId = next.members.find((m) => m !== uid);
          const partnerCheckedInToday = !!partnerId && next.lastCheckIn[partnerId] === todayString();
          const iCheckedInToday = next.lastCheckIn[uid] === todayString();

          if (
            prevPartnerCheckedIn.current === false &&
            partnerCheckedInToday &&
            !iCheckedInToday
          ) {
            notifyPartnerCheckedIn();
          }
          prevPartnerCheckedIn.current = partnerCheckedInToday;

          setGarden(next);
        } else {
          setGarden(null);
          prevPartnerCheckedIn.current = null;
        }
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const createGarden = async () => {
    setError("");
    try {
      await addDoc(collection(db, "gardens"), {
        code: generateCode(),
        members: [uid],
        stage: 0,
        streak: 0,
        lastCheckIn: {},
        lastSuccessDate: null,
        history: {},
        notes: {},
        flowerColor: "pink",
        createdAt: new Date(),
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const joinGarden = async (rawCode: string) => {
    setError("");
    const code = rawCode.trim().toUpperCase();
    const q = query(collection(db, "gardens"), where("code", "==", code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const err = "No garden found with that code.";
      setError(err);
      throw new Error(err);
    }
    const gardenDoc = snapshot.docs[0];
    const data = gardenDoc.data();

    if ((data.members ?? []).includes(uid)) {
      const err = "You're already in this garden.";
      setError(err);
      throw new Error(err);
    }
    if ((data.members ?? []).length >= 2) {
      const err = "This garden is already full.";
      setError(err);
      throw new Error(err);
    }

    await updateDoc(doc(db, "gardens", gardenDoc.id), {
      members: arrayUnion(uid),
    });
  };

  const checkIn = async (note?: string) => {
    if (!garden) return;
    setError("");
    const today = todayString();
    const yesterday = yesterdayString(today);
    const updatedCheckIns = { ...garden.lastCheckIn, [uid]: today };
    const allCheckedIn = garden.members.every((m) => updatedCheckIns[m] === today);

    const updates: Record<string, any> = {};
    updates[`lastCheckIn.${uid}`] = today;
    updates[`history.${today}.${uid}`] = true;
    if (note && note.trim()) {
      updates[`notes.${uid}`] = { text: note.trim().slice(0, 140), date: today };
    }

    let nextMilestone: Milestone = null;

    if (allCheckedIn && garden.members.length > 1) {
      let newStage = garden.stage;
      let newStreak = garden.streak;

      if (garden.lastSuccessDate) {
        const gap = daysBetween(garden.lastSuccessDate, today);
        if (gap > 1) {
          newStage = Math.max(0, garden.stage - 1);
          newStreak = 1;
        } else {
          newStreak = (garden.streak || 0) + 1;
        }
      } else {
        newStreak = 1;
      }

      newStage = Math.min(newStage + 1, STAGE_NAMES.length - 1);

      updates.stage = newStage;
      updates.streak = newStreak;
      updates.lastSuccessDate = today;

      if (newStage === STAGE_NAMES.length - 1 && garden.stage !== newStage) {
        nextMilestone = { type: "stage", label: STAGE_NAMES[newStage] };
      } else if (STREAK_MILESTONES.includes(newStreak)) {
        nextMilestone = { type: "streak", value: newStreak };
      }
    }

    try {
      await updateDoc(doc(db, "gardens", garden.id), updates);
      if (nextMilestone) setMilestone(nextMilestone);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const clearMilestone = () => setMilestone(null);

  const setFlowerColor = async (color: FlowerColorKey) => {
    if (!garden) return;
    try {
      await updateDoc(doc(db, "gardens", garden.id), { flowerColor: color });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const leaveGarden = async () => {
    if (!garden) return;
    try {
      if (garden.members.length <= 1) {
        await deleteDoc(doc(db, "gardens", garden.id));
      } else {
        await updateDoc(doc(db, "gardens", garden.id), {
          members: arrayRemove(uid),
        });
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const partnerId = garden?.members.find((m) => m !== uid) ?? null;
  const partnerCheckedInToday = !!partnerId && garden?.lastCheckIn[partnerId] === todayString();
  const iCheckedInToday = garden?.lastCheckIn[uid] === todayString();
  const partnerNote = partnerId ? garden?.notes[partnerId] : undefined;
  const myNote = garden?.notes[uid];

  return {
    uid,
    loading,
    garden,
    error,
    setError,
    milestone,
    clearMilestone,
    createGarden,
    joinGarden,
    checkIn,
    leaveGarden,
    setFlowerColor,
    partnerId,
    partnerCheckedInToday,
    iCheckedInToday,
    partnerNote,
    myNote,
    today: todayString(),
  };
}
