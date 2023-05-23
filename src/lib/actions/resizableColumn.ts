export function resizableColumn(node: Node) {
    let x: number;

    function handleMousedown(evt: Event): void {
        x = (evt as MouseEvent).clientX;

        node.dispatchEvent(
            new CustomEvent("resizing", {
                detail: { x: 0 },
            })
        );

        window.addEventListener("mousemove", handleMousemove);
        window.addEventListener("mouseup", handleMouseup);
    }

    function handleMousemove(event: MouseEvent) {
        const dx = event.clientX - x;
        x = event.clientX;

        node.dispatchEvent(
            new CustomEvent("resizing", {
                detail: { x: dx },
            })
        );
    }

    function handleMouseup(event: MouseEvent) {
        const dx = event.clientX - x;

        node.dispatchEvent(
            new CustomEvent("resizing", {
                detail: { x: dx },
            })
        );

        window.removeEventListener("mousemove", handleMousemove);
        window.removeEventListener("mouseup", handleMouseup);
    }

    node.addEventListener("mousedown", handleMousedown);

    return {
        destroy() {
            node.removeEventListener("mousedown", handleMousedown);
        },
    };
}