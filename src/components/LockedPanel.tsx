import Link from "next/link";
import { FaCrown, FaLock, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import type { AccessLevel } from "@/db/schema";
import { btnPrimary, btnSecondary, btnVip } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function LockedPanel({
  level,
  loggedIn,
  next = "/",
  what = "este contenido",
}: {
  level: AccessLevel;
  loggedIn: boolean;
  next?: string;
  what?: string;
}) {
  const isVip = level === "vip";
  const n = encodeURIComponent(next);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 text-center sm:p-8",
        isVip
          ? "border-amber-400/40 bg-linear-to-br from-amber-500/15 via-black/50 to-brand/10"
          : "border-sky-400/40 bg-linear-to-br from-sky-500/15 via-black/50 to-brand/10",
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border-2 bg-black/60 text-2xl",
          isVip ? "border-amber-400 text-amber-300" : "border-sky-400 text-sky-300",
        )}
      >
        {isVip ? <FaCrown /> : <FaLock />}
      </div>
      <h3 className="text-xl font-extrabold text-white sm:text-2xl">
        {isVip ? "Contenido exclusivo VIP" : "Contenido solo para usuarios registrados"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
        {isVip
          ? `Solo puedes ver la portada. Para acceder a ${what} (descripción completa, galería, video, instrucciones y enlaces de descarga) necesitas ser miembro VIP: haz una donación o suscríbete.`
          : `Solo puedes ver la portada. Crea una cuenta gratuita para acceder a ${what}: descripción completa, galería, video, instrucciones y enlaces de descarga.`}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isVip ? (
          loggedIn ? (
            <Link href="/vip" className={btnVip}>
              <FaCrown /> Hazte VIP ahora
            </Link>
          ) : (
            <>
              <Link href="/vip" className={btnVip}>
                <FaCrown /> Ver planes VIP
              </Link>
              <Link href={`/registro?next=${encodeURIComponent("/vip")}`} className={btnSecondary}>
                <FaUserPlus /> Crear cuenta
              </Link>
              <Link href={`/login?next=${n}`} className={btnSecondary}>
                <FaSignInAlt /> Iniciar sesión
              </Link>
            </>
          )
        ) : (
          <>
            <Link href={`/registro?next=${n}`} className={btnPrimary}>
              <FaUserPlus /> Registrarme gratis
            </Link>
            <Link href={`/login?next=${n}`} className={btnSecondary}>
              <FaSignInAlt /> Ya tengo cuenta
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
