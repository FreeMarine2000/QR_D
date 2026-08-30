import qrcode
import sys

def generate_qr(link, filename="qrcode.jpg"):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(link)
    qr.make(fit=True)
    print("\n--- Terminal QR Code ---")
    qr.print_ascii(invert=True) 
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.convert("RGB")
    img.save(filename)
    
    print(f"\nSuccess! QR code saved locally to your current directory as {filename}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = input("Enter the link to convert: ")
        
    generate_qr(url)