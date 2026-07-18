"use client";

import { useEffect, useState, useCallback } from "react";

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export interface PermissionsMap {
  camera: PermissionState;
  microphone: PermissionState;
}

async function queryPermission(name: PermissionName): Promise<PermissionState> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const result = await navigator.permissions.query({ name });
    return (result.state as PermissionState) || "unknown";
  } catch {
    return "unknown";
  }
}

export function usePermissions() {
  const [perms, setPerms] = useState<PermissionsMap>({
    camera: "unknown",
    microphone: "unknown",
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [camera, microphone] = await Promise.all([
      queryPermission("camera" as PermissionName),
      queryPermission("microphone" as PermissionName),
    ]);
    setPerms({ camera, microphone });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!navigator.permissions?.query) return;

    let cameraStatus: PermissionStatus | null = null;
    let micStatus: PermissionStatus | null = null;

    const setupListeners = async () => {
      try {
        cameraStatus = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        micStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        const onChange = () => {
          setPerms({
            camera: (cameraStatus?.state as PermissionState) || "unknown",
            microphone: (micStatus?.state as PermissionState) || "unknown",
          });
        };

        cameraStatus?.addEventListener("change", onChange);
        micStatus?.addEventListener("change", onChange);

        return () => {
          cameraStatus?.removeEventListener("change", onChange);
          micStatus?.removeEventListener("change", onChange);
        };
      } catch {
        // Permissions API not fully available
      }
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  const isBlocked = perms.camera === "denied" || perms.microphone === "denied";

  return { perms, loading, isBlocked, refresh };
}
