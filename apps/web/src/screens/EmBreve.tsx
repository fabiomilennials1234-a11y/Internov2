export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">{titulo}</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5">
        Validado no mockup, backend pronto. Tela em construção nesta fase.
      </p>
    </div>
  );
}
