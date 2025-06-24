import * as React from "react"

/**
 * Stub muito simples para o componente Slot do Radix-UI.
 * Ele apenas clona o elemento filho, repassando props/ref.
 * É suficiente para compilar o projecto caso o pacote real não esteja instalado.
 */
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function Slot(
  { children, ...rest },
  ref,
) {
  const child = React.Children.only(children) as React.ReactElement<any>
  return React.cloneElement(child, { ref, ...rest })
})

export default Slot
