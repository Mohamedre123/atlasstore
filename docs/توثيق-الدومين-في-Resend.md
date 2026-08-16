# توثيق الدومين في Resend

الخطوة دي بتحلّ **مشكلتين مع بعض**:

1. تقدر تبعت الأوردرات لأي إيميل (زي `iaomn8406@gmail.com`) مش بس لإيميل حساب Resend
2. الإيميل يبطّل يروح في الـ **Spam**

---

## ليه الإيميل بيروح سبام دلوقتي؟

إحنا بنبعت من `onboarding@resend.dev` — ده عنوان **مشترك** بين كل حسابات Resend الجديدة. جيميل شايف إن آلاف الناس بتبعت منه، فبيتعامل معاه بريبة.

لما تبعت من `orders@atlass-clothes.store` بدومينك الموثّق، جيميل بيتأكد بالسجلات إن الرسالة فعلًا منك، فبتنزل في الوارد.

---

## معلومات لازم تعرفها قبل ما تبدأ

دومينك **`atlass-clothes.store`** مسجّل على **Hostinger** — عرفنا كده من الـ nameservers:

```
apollo.dns-parking.com
athena.dns-parking.com
```

يعني هتضيف سجلات DNS من لوحة Hostinger.

---

## الخطوات

### 1. ضيف الدومين في Resend

1. ادخل <https://resend.com/domains>
2. اضغط **Add Domain**
3. اكتب: `send.atlass-clothes.store`

> **ليه `send.` قدامها؟** لأنها **سَب دومين** مخصص للإرسال. كده لو حصلت مشكلة في سمعة الإرسال، دومينك الأساسي مايتأثرش. ده اللي Resend نفسها بتنصح بيه.

4. اختار **Region: EU (Ireland)** — أقرب لمصر
5. اضغط **Add**

### 2. Resend هيديك سجلات

هتلاقي جدول فيه **٣ سجلات** تقريبًا بالشكل ده:

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey.send` | `p=MIGfMA0GCSq...` (نص طويل) |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (أولوية 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

**سيبها مفتوحة في تاب** وافتح Hostinger في تاب تاني.

### 3. ضيف السجلات في Hostinger

1. ادخل <https://hpanel.hostinger.com>
2. من فوق اضغط **Domains** → اختار `atlass-clothes.store`
3. من القايمة الجنب اضغط **DNS / Nameservers**
4. انزل لقسم **Manage DNS records**

دلوقتي ضيف السجلات **واحد واحد**:

#### السجل الأول (DKIM)

- **Type:** `TXT`
- **Name:** `resend._domainkey.send`
- **TXT value:** انسخ القيمة الطويلة من Resend كاملة
- **TTL:** سيبه زي ما هو
- اضغط **Add Record**

#### السجل التاني (MX)

- **Type:** `MX`
- **Name:** `send`
- **Mail server:** `feedback-smtp.eu-west-1.amazonses.com`
- **Priority:** `10`
- اضغط **Add Record**

#### السجل التالت (SPF)

- **Type:** `TXT`
- **Name:** `send`
- **TXT value:** `v=spf1 include:amazonses.com ~all`
- اضغط **Add Record**

> ⚠️ **مهم في Hostinger:** لو Resend كاتب الاسم `resend._domainkey.send.atlass-clothes.store`، انت تكتب في Hostinger **`resend._domainkey.send`** بس من غير اسم الدومين — Hostinger بيضيفه لوحده.

### 4. سجل DMARC (مهم جدًا للسبام)

ده مش بيطلبه Resend بس بيفرق كتير مع جيميل:

- **Type:** `TXT`
- **Name:** `_dmarc`
- **TXT value:**
  ```
  v=DMARC1; p=none; rua=mailto:atlassstore36@gmail.com
  ```
- اضغط **Add Record**

### 5. تأكيد التوثيق

1. ارجع لـ Resend → **Domains**
2. اضغط **Verify DNS Records**
3. لو لسه مش شغال، استنى شوية وجرّب تاني — عادة بياخد من **١٥ دقيقة لساعة**، وممكن يوصل ٢٤ ساعة
4. لما يخلص هتلاقي الحالة بقت **Verified** بالأخضر

### 6. غيّر الإعدادات

في **`.env.local`** عندك **وفي Vercel → Settings → Environment Variables**:

```bash
ORDER_EMAIL_FROM=ATLASs Store <orders@send.atlass-clothes.store>
ORDER_EMAIL_TO=iaomn8406@gmail.com
```

بعدها اعمل **Redeploy** من Vercel.

---

## بعد التوثيق

- الأوردرات هتوصل لأي إيميل تحطه في `ORDER_EMAIL_TO`
- تقدر تحط أكتر من إيميل بفاصلة:
  ```bash
  ORDER_EMAIL_TO=iaomn8406@gmail.com,atlassstore36@gmail.com
  ```
- الرسايل هتنزل في الوارد مش السبام

---

## حاجات إضافية تقلل السبام

### افتح الرسالة وقول إنها مش سبام

أول ما توصلك رسالة في السبام:
1. افتحها
2. اضغط **Report not spam** أو **ليست رسالة غير مرغوب فيها**
3. ضيف العنوان لجهات الاتصال

ده بيعلّم جيميل إن رسايلك مطلوبة.

### اتأكد إن العنوان نضيف

عدّلنا عنوان الرسالة يبقى `أوردر جديد ATL-XXXX — اسم العميل` بدل ما كان فيه السعر والمحافظة. المبالغ والرموز في العنوان من أشهر أسباب السبام.

### راجع لوجز Resend

<https://resend.com/emails> — بتوريك كل رسالة اتبعت، ووصلت ولا اترفضت، والسبب.

---

## لو مش عايز تعمل توثيق دلوقتي

المتجر شغال عادي وإيميل الأوردر بيوصل على **`atlassstore36@gmail.com`**، بس:

- بس على الإيميل ده
- وغالبًا في السبام (شوف هناك أول ما تعمل أوردر)

التوثيق مش مستعجل، بس لما تخلصه هتريح نفسك من الاتنين.
