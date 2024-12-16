import {useState, useEffect, createContext, useContext} from 'react'

const TextSizeContext = createContext()

export const useTextSize = () => useContext(TextSizeContext)

export const TextSizeProvider = ({children}) => {
    const [textSize, setTextSize] = useState('text-xs')

    const updateTextSize = (width) => {
        if(width <= 1680) {
            setTextSize('text-xs')
        }else{
            setTextSize('text-sm')
        }
    }

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width

            updateTextSize(width)
        })

        resizeObserver.observe(document.body)

        updateTextSize(window.innerWidth)

        return () => resizeObserver.disconnect()
    }, [])

    return (
        <TextSizeContext.Provider value={textSize}>
            {children}
        </TextSizeContext.Provider>
    )
}

export default TextSizeProvider