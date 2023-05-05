export function resizableColumn(node: Node) {
    let x: number;
    let y: number;

    function handleMousedown(evt: Event): void {
        x = (evt as MouseEvent).clientX;
        y = (evt as MouseEvent).clientY;

        node.dispatchEvent(
            new CustomEvent("resizing", {
                detail: { x: 0, y: 0 },
            })
        );

        window.addEventListener("mousemove", handleMousemove, true);
        window.addEventListener("mouseup", handleMouseup, true);
    }

    function handleMousemove(event: MouseEvent) {
        const dx = event.clientX - x;
        const dy = event.clientY - y;
        x = event.clientX;
        y = event.clientY;

        node.dispatchEvent( //CAUSES YANK ON THE FLIP ANIMATION
            new CustomEvent("resizing", {
                detail: { x: dx, y: dy },
            })
        );
    }

    function handleMouseup(event: MouseEvent) {
        const dx = event.clientX - x;
        const dy = event.clientY - y;

        node.dispatchEvent(
            new CustomEvent("resizing", {
                detail: { x: dx, y: dy },
            })
        );

        window.removeEventListener("mousemove", handleMousemove, true);
        window.removeEventListener("mouseup", handleMouseup, true);
    }

    node.addEventListener("mousedown", handleMousedown, true);

    return {
        destroy() {
            node.removeEventListener("mousedown", handleMousedown, true);
        },
    };
}