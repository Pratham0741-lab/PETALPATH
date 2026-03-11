'use client'

import dynamic from 'next/dynamic'
import GlassNav from '@/components/ui/GlassNav'
import HeroSection from '@/components/landing/HeroSection'
import StorySection from '@/components/landing/StorySection'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import ParentPreview from '@/components/landing/ParentPreview'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import MagicButton from '@/components/ui/MagicButton'
import { PetalFlower, SparkleIcon } from '@/components/ui/PetalIcons'

// Lazy load the heavy Three.js scene
const FloatingScene = dynamic(() => import('@/components/landing/FloatingScene'), {
  ssr: false,
  loading: () => null,
})

function SectionDivider() {
  return <div className="section-divider mx-auto max-w-4xl" />
}

function SocialProof() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="py-12 text-center"
    >
      <div className="section-container">
        <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 font-semibold text-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['#FDA4AF', '#C4B5FD', '#7DD3FC', '#6EE7B7'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: color }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="5" r="3" fill="white" opacity="0.7" />
                    <path d="M2 11C2 9 4 7 6 7C8 7 10 9 10 11" fill="white" opacity="0.4" />
                  </svg>
                </div>
              ))}
            </div>
            <span>1,000+ happy families</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L9.8 5.8L15 6.4L11.2 9.8L12.2 15L8 12.4L3.8 15L4.8 9.8L1 6.4L6.2 5.8L8 1Z" fill="#FACC15" />
              </svg>
            ))}
            <span>4.9/5 from parents</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CTAFooter() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(196,181,253,0.1), transparent, transparent)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl" style={{ background: 'rgba(196,181,253,0.1)' }} />
      </div>

      <div className="section-container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-8 inline-block"
          >
            <PetalFlower size={64} />
          </motion.div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-6 max-w-2xl mx-auto">
            Ready to start your child&apos;s{' '}
            <span className="text-aurora-gradient">learning adventure?</span>
          </h2>

          <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-md mx-auto">
            Join thousands of parents who trust PetalPath for their child&apos;s early development.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <MagicButton variant="primary" size="lg" href="/signup">
              Get Started — It&apos;s Free
            </MagicButton>
            <MagicButton variant="ghost" size="lg" href="/login">
              Already have an account?
            </MagicButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-8 border-t border-slate-100">
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PetalFlower size={24} />
          <span className="font-black text-slate-700">PetalPath</span>
        </div>
        <p className="text-sm text-slate-400 font-medium">
          © {new Date().getFullYear()} PetalPath. Making learning magical.
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <GlassNav />

      {/* Hero with Three.js background */}
      <div className="relative">
        <FloatingScene />
        <HeroSection />
      </div>

      <SectionDivider />
      <StorySection />

      <SectionDivider />
      <FeatureShowcase />

      <SectionDivider />
      <ParentPreview />

      <SocialProof />
      <SectionDivider />

      <CTAFooter />
      <Footer />
    </main>
  )
}
