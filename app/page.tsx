import dynamic from "next/dynamic";
import RegisterSW from "@/components/RegisterSW";

const DottorSOS = dynamic(() => import("@/components/DottorSOS"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#111] text-white flex items-center justify-center text-xl font-bold">
      DOTTOR SOS · caricamento mappa…
    </div>
  ),
});

export default function Page() {
  return (
    <>
      <RegisterSW />
      <DottorSOS />
    </>
  );
}
