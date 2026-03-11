'use client';

import dynamic from 'next/dynamic';

const ClickSpark = dynamic(() => import('@/components/ClickSpark'), { 
  ssr: false 
});

export default function ClickSparkProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClickSpark
        sparkColor="#d822c9"
        sparkSize={20}
        sparkRadius={15}
        sparkCount={10}
        duration={500}
        easing="ease-out"
        extraScale={1}
      />
      {children}
    </>
  );
}
