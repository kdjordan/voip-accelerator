import { onMounted, onBeforeUnmount } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export function useGsap() {
  const animations: gsap.core.Tween[] = [];
  const scrollTriggers: ScrollTrigger[] = [];

  // Create animation and add to cleanup list
  function createAnimation(
    targets: string | Element | Element[] | NodeList,
    vars: gsap.TweenVars,
    scrollTriggerParams?: gsap.plugins.ScrollTriggerInstanceVars
  ) {
    if (scrollTriggerParams) {
      vars.scrollTrigger = scrollTriggerParams;
      const anim = gsap.to(targets, vars);
      animations.push(anim);

      // Store the ScrollTrigger instance for cleanup
      if (anim.scrollTrigger) {
        scrollTriggers.push(anim.scrollTrigger as unknown as ScrollTrigger);
      }
      return anim;
    } else {
      const anim = gsap.to(targets, vars);
      animations.push(anim);
      return anim;
    }
  }

  // Automatically clean up animations when component unmounts
  onBeforeUnmount(() => {
    animations.forEach((anim) => anim.kill());
    scrollTriggers.forEach((trigger) => trigger.kill());
  });

  return {
    gsap,
    ScrollTrigger,
    createAnimation,
  };
}
