import fitz
from PIL import Image


def pdf_to_images(file_storage):
    """Convert an uploaded PDF into PIL RGB images, one image per page."""
    pdf_bytes = file_storage.read()

    if not pdf_bytes:
        raise ValueError("The uploaded PDF is empty.")

    document = fitz.open(stream=pdf_bytes, filetype="pdf")

    try:
        if document.page_count == 0:
            raise ValueError("The PDF does not contain any pages.")

        images = []
        matrix = fitz.Matrix(2, 2)

        for page in document:
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            image = Image.frombytes(
                "RGB",
                (pixmap.width, pixmap.height),
                pixmap.samples,
            )
            images.append(image)

        return images
    finally:
        document.close()
