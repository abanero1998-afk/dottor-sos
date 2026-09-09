import dynamic from "next/dynamic";

const DottorSOS = dynamic(() => import("@/components/DottorSOS"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#F5F5F7] flex items-center justify-center">
      <p className="font-bold">DOTTOR SOS · caricamento mappa…</p>
    </div>
  ),
});

export default function Page() {
  return <DottorSOS />;
}
