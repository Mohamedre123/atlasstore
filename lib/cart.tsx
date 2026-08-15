'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import type { CartItem, Product } from './types'

const STORAGE_KEY = 'atlas_cart_v1'

/* ------------------------------------------------------------
   مفتاح العنصر = المنتج + المتغيرات المختارة
   يعني نفس التيشرت بمقاس L ومقاس M = سطرين منفصلين في السلة
   ------------------------------------------------------------ */
function makeKey(productId: string, variants: Record<string, string>): string {
  const parts = Object.keys(variants)
    .sort()
    .map((k) => `${k}:${variants[k]}`)
  return parts.length ? `${productId}__${parts.join('|')}` : productId
}

type State = { items: CartItem[] }

type Action =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; product: Product; variants: Record<string, string>; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'setQty'; key: string; quantity: number }
  | { type: 'clear' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items }

    case 'add': {
      const { product, variants, quantity } = action
      const key = makeKey(product.id, variants)
      const existing = state.items.find((i) => i.key === key)

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 99) } : i
          ),
        }
      }

      const item: CartItem = {
        key,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? '',
        quantity: Math.min(quantity, 99),
        selectedVariants: variants,
        sku: product.sku,
      }
      return { items: [...state.items, item] }
    }

    case 'remove':
      return { items: state.items.filter((i) => i.key !== action.key) }

    case 'setQty': {
      if (action.quantity < 1) {
        return { items: state.items.filter((i) => i.key !== action.key) }
      }
      return {
        items: state.items.map((i) =>
          i.key === action.key ? { ...i, quantity: Math.min(action.quantity, 99) } : i
        ),
      }
    }

    case 'clear':
      return { items: [] }
  }
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  ready: boolean
  isOpen: boolean
  /** آخر عنصر اتضاف — بنستخدمه في أنيميشن التأكيد */
  lastAdded: string | null
  addItem: (product: Product, variants: Record<string, string>, quantity?: number) => void
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })
  const [ready, setReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  /* استرجاع السلة من المتصفح عند أول تحميل */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) dispatch({ type: 'hydrate', items: parsed })
      }
    } catch {
      /* لو البيانات باظت نبدأ بسلة فاضية */
    }
    setReady(true)
  }, [])

  /* حفظ السلة مع كل تغيير */
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      /* الحفظ ممكن يفشل في وضع التصفح الخفي */
    }
  }, [state.items, ready])

  /* قفل تمرير الصفحة والسلة مفتوحة */
  useEffect(() => {
    document.body.classList.toggle('drawer-open', isOpen)
    return () => document.body.classList.remove('drawer-open')
  }, [isOpen])

  /* الخروج بزر Escape */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const addItem = useCallback(
    (product: Product, variants: Record<string, string>, quantity = 1) => {
      dispatch({ type: 'add', product, variants, quantity })
      setLastAdded(makeKey(product.id, variants))
      setIsOpen(true)
    },
    []
  )

  const removeItem = useCallback((key: string) => dispatch({ type: 'remove', key }), [])

  const setQuantity = useCallback(
    (key: string, quantity: number) => dispatch({ type: 'setQty', key, quantity }),
    []
  )

  const clearCart = useCallback(() => dispatch({ type: 'clear' }), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const count = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  )

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  )

  const value: CartContextValue = {
    items: state.items,
    count,
    subtotal,
    ready,
    isOpen,
    lastAdded,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    openCart,
    closeCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart لازم يكون جوه CartProvider')
  return ctx
}
