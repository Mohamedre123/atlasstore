/* ============================================================
   خلفية الموقع المتحركة
   ------------------------------------------------------------
   طبقة واحدة ثابتة ورا الصفحة كلها، فيها كور ضوء بألوان اللوجو
   بتتحرك ببطء + شبكة خطوط بتزحف. كده مفيش أي جزء في الموقع
   بيبان ساده أو ميت، من غير ما نكرر خلفية في كل قسم.

   • position: fixed → بتتحرك مع التمرير فالإحساس بالعمق بيفضل
   • z-index: -1 → ورا كل المحتوى، ومش بتاخد أي ضغطات
   • على الفون بنقلل عدد الكور (CSS) عشان ما تتقلش
   ============================================================ */
export function SiteBackground() {
  return (
    <div aria-hidden="true" className="site-bg">
      <span className="site-bg__orb site-bg__orb--a" />
      <span className="site-bg__orb site-bg__orb--b" />
      <span className="site-bg__orb site-bg__orb--c" />
      <span className="site-bg__orb site-bg__orb--d" />
      <span className="site-bg__grid" />
      <span className="site-bg__veil" />
    </div>
  )
}
