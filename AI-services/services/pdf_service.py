import fitz
from io import BytesIO
from PIL import Image


def pdf_to_images(pdf_data):
    """
    Convert PDF data into PIL images.

    Accepts:
    - bytes
    - bytearray
    - file-like objects
    - file paths
    """

    if pdf_data is None:
        raise ValueError("PDF data is empty.")

    if isinstance(pdf_data, (bytes, bytearray)):
        pdf_bytes = bytes(pdf_data)

    elif hasattr(pdf_data, "read"):
        pdf_bytes = pdf_data.read()

    elif isinstance(pdf_data, str):
        with open(pdf_data, "rb") as file:
            pdf_bytes = file.read()

    else:
        raise TypeError(f"Unsupported PDF input type: {type(pdf_data).__name__}")

    if not pdf_bytes:
        raise ValueError("PDF file is empty.")

    document = fitz.open(stream=pdf_bytes, filetype="pdf")

    images = []

    try:
        for page_number in range(len(document)):
            page = document.load_page(page_number)

            matrix = fitz.Matrix(2.0, 2.0)

            pixmap = page.get_pixmap(matrix=matrix, alpha=False)

            image = Image.open(BytesIO(pixmap.tobytes("png"))).convert("RGB")

            images.append(image.copy())

    finally:
        document.close()

    return images
