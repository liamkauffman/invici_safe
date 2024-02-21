def get_main_header(header):
    header_mappings = {
        'SKU': ['Item #', 'Product'],
        'BARCODE': [],
        'DESCRIPTION': ['Item Name'],
        'SIZE': ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large', 'XXL', 'XS', 'XL', 'S', 'M', 'L', 'OS', 'AL'],
        'HS CODE': [],
        'Units': ['Quantity', 'Ordered', 'Units', 'Unit'],
        'QTY': ['Total Units', 'Quantity', 'Order QTY', 'Totals'],
        'Item Price': ['Unit Price', 'Price', 'Wholesale', 'Cost'],
        'Disc $': [],
        'Discount': ['Disc %'],
        'Item Net': ['Net Price', 'Total $', 'Total Line Value'],
        'Item Tax': [],
        'Total': ['Total Amount', 'Amount', 'Totals', 'Value of Goods'],
        'Season': [],
        'Color': [],
        'Style': [],
        'MSRP': ['SRP'],
        'No.': ['Item Number']
    }

    # Convert input to lowercase and remove spaces for case-insensitive matching
    header = header.lower().replace(" ", "")
    
    # Iterate through the header mappings and find the main header
    for main_header, iterations in header_mappings.items():
        main_header_formatted = main_header.lower().replace(" ", "")  # Convert main header to lowercase and remove spaces
        if header == main_header_formatted:
            return main_header
        elif header in [iteration.lower().replace(" ", "") for iteration in iterations]:
            return main_header
    
    # If no main header found, return None
    return None



