from flask import Flask, request, jsonify, send_from_directory, current_app, render_template, url_for
import requests
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
#from dotenv import load_dotenv
from datetime import datetime
import os
import urllib.parse
import time
import re  # Regular expressions for simple validation

# Load .env file
basedir = os.path.abspath(os.path.dirname(__file__))
#load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)

def versioned_url(path: str) -> str:
    """
    Accepts paths like:
      'static/images/favicon.ico'  or  'images/favicon.ico'
    and returns a cache-busted static URL like:
      '/static/images/favicon.ico?v=1234567890'
    """
    # Normalise input: strip leading slash
    filename = path.lstrip('/')

    # If it starts with 'static/', strip that so we only pass the relative part to url_for
    if filename.startswith('static/'):
        filename = filename[len('static/'):]

    # Build absolute file path
    file_path = os.path.join(app.static_folder, filename)

    # If the file exists, append its mtime as a version param
    if os.path.exists(file_path):
        v = int(os.path.getmtime(file_path))
        return url_for('static', filename=filename, v=v)

    # Fallback: no version param
    return url_for('static', filename=filename)

# Make it available to ALL templates automatically
app.jinja_env.globals['versioned_url'] = versioned_url

# Configure Flask-Mail using environment variables
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '465'))  # Provide a default value if not set
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'False').lower() in ['true', '1', 't']
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'True').lower() in ['true', '1', 't']

mail = Mail(app)
    
@app.route('/api/proxy/lots', methods=['GET'])
def proxy():
    try:
        # This is the token you would have previously fetched from an environment variable
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        
        # The external API endpoint you are trying to query
        external_api_url = 'https://ams-services.eigroup.co.uk/v2/lots'
        
        # Get the parameters from the request
        params = request.args
        
        # Send a request to the external API
        response = requests.get(external_api_url, headers={
            'Authorization': f'Bearer {EIGroupToken}'
        }, params=params)
        
        # Check if the external request was successful
        if response.status_code == 200:
            # Return the response from the external API
            return jsonify(response.json())
        else:
            # Log the error somewhere, like a logging service or a file
            app.logger.error(f"Failed to fetch data: {response.text}")
            # Return a generic error message
            return jsonify({'error': 'Failed to fetch data from the external API'}), 502
    except Exception as e:
        # Log the exception
        app.logger.exception("An error occurred during the proxy call")
        # Return a generic error message
        return jsonify({'error': 'An unexpected error occurred'}), 500
    

@app.route('/api/proxy/online-auction-groups', methods=['GET'])
def proxy_2():
    try:
        # This is the token you would have previously fetched from an environment variable
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        
        # The external API endpoint you are trying to query
        external_api_url = 'https://ams-services.eigroup.co.uk/v2/online-auction-groups'
        
        # Get the parameters from the request
        params = request.args
        
        # Send a request to the external API
        response = requests.get(external_api_url, headers={
            'Authorization': f'Bearer {EIGroupToken}'
        }, params=params)
        
        # Check if the external request was successful
        if response.status_code == 200:
            # Return the response from the external API
            return jsonify(response.json())
        else:
            # Log the error somewhere, like a logging service or a file
            app.logger.error(f"Failed to fetch data: {response.text}")
            # Return a generic error message
            return jsonify({'error': 'Failed to fetch data from the external API'}), 502
    except Exception as e:
        # Log the exception
        app.logger.exception("An error occurred during the proxy call")
        # Return a generic error message
        return jsonify({'error': 'An unexpected error occurred'}), 500
    

@app.route('/api/proxy/online-auctions', methods=['GET'])
def proxy_3():
    try:
        # This is the token you would have previously fetched from an environment variable
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        
        # The external API endpoint you are trying to query
        external_api_url = 'https://ams-services.eigroup.co.uk/v2/online-auctions'
        
        # Get the parameters from the request
        params = request.args
        
        # Send a request to the external API
        response = requests.get(external_api_url, headers={
            'Authorization': f'Bearer {EIGroupToken}'
        }, params=params)
        
        # Check if the external request was successful
        if response.status_code == 200:
            # Return the response from the external API
            return jsonify(response.json())
        else:
            # Log the error somewhere, like a logging service or a file
            app.logger.error(f"Failed to fetch data: {response.text}")
            # Return a generic error message
            return jsonify({'error': 'Failed to fetch data from the external API'}), 502
    except Exception as e:
        # Log the exception
        app.logger.exception("An error occurred during the proxy call")
        # Return a generic error message
        return jsonify({'error': 'An unexpected error occurred'}), 500
    

### CURRENT LOTS DYNAMIC RENDERING  

API_BASE_URL = 'https://ams-services.eigroup.co.uk/v2/lots/details/'

@app.route('/lot_details/<int:lot_id>')
def lot_details(lot_id):
    EIGroupToken = os.getenv('EIGROUP_TOKEN')
    if not EIGroupToken:
        app.logger.error('API token not set in environment')
        return "Internal server error: EI Group token not configured.", 500

    url = f"{API_BASE_URL}{lot_id}"
    try:
        response = requests.get(url, headers={'Authorization': f'Bearer {EIGroupToken}'}, timeout=10)
    except requests.RequestException:
        app.logger.exception("Network-related error fetching lot details")
        return render_template('error.html'), 500

    if response.status_code == 200:
        try:
            lot_data = response.json()
        except ValueError:
            app.logger.exception("Failed to decode JSON from EI Group")
            return render_template('error.html'), 500

        return render_template('lot_details.html', lot=lot_data)

    # Treat 204 and other non-200 as "not found"
    app.logger.error(f"Failed to fetch lot data {lot_id}: {response.status_code} - {response.text[:500]}")
    return render_template('404.html'), 404

    
@app.route('/api/lot_details/<int:lot_id>')
def api_lot_details(lot_id):
    try:
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        if not EIGroupToken:
            app.logger.error('API token not set in environment')
            return jsonify({'error': 'Internal server error'}), 500
        
        response = requests.get(f"{API_BASE_URL}{lot_id}", headers={'Authorization': f'Bearer {EIGroupToken}'})

        data = response.json()
        if response.status_code == 200:
            # Instead of returning the JSON directly, wrap the data in a 'lot' key
            return jsonify({'lot': data}), 200
        else:
            app.logger.error(f"Failed to fetch lot data: {response.status_code} - {response.text}")
            return jsonify({'error': 'Lot not found'}), 404

    except requests.RequestException as e:
        app.logger.exception("A network-related error occurred")
        return jsonify({'error': 'Internal server error'}), 500
    except Exception as e:
        app.logger.exception("An unexpected error occurred")
        return jsonify({'error': 'Internal server error'}), 500
    

### PREVIOUS LOT DETAILS
    
API_BASE_URL_2 = 'https://ams-services.eigroup.co.uk/v2/online-auctions/'
    
@app.route('/previous_lot_details/<int:lot_id>')
def previous_lot_details(lot_id):
    try:
        # Obtain API token from environment variable
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        if not EIGroupToken:
            app.logger.error('API token not set in environment')
            return render_template('error.html'), 500
            
        response = requests.get(f"{API_BASE_URL_2}/{lot_id}", headers={'Authorization': f'Bearer {EIGroupToken}'})

        if response.status_code == 200:
            # Parse the lot data from the response
            lot_data = response.json()
            return render_template('previous_lot_details.html', lot=lot_data)
        else:
            # Log the error and render a 404 page if the lot is not found
            app.logger.error(f"Failed to fetch lot data: {response.status_code} - {response.text}")
            return render_template('404.html'), 404

    except requests.RequestException as e:
        # Handle specific requests exceptions
        app.logger.exception("A network-related error occurred")
        return render_template('error.html'), 500
    except Exception as e:
        # Log the error and return a generic 500 error page
        app.logger.exception("An unexpected error occurred")
        return render_template('error.html'), 500
    
@app.route('/api/previous_lot_details/<int:lot_id>')
def api_previous_lot_details(lot_id):
    try:
        EIGroupToken = os.getenv('EIGROUP_TOKEN')
        if not EIGroupToken:
            app.logger.error('API token not set in environment')
            return jsonify({'error': 'Internal server error'}), 500
        
        response = requests.get(f"{API_BASE_URL_2}/{lot_id}", headers={'Authorization': f'Bearer {EIGroupToken}'})

        data = response.json()
        if response.status_code == 200:
            # Instead of returning the JSON directly, wrap the data in a 'lot' key
            return jsonify({'lot': data}), 200
        else:
            app.logger.error(f"Failed to fetch lot data: {response.status_code} - {response.text}")
            return jsonify({'error': 'Lot not found'}), 404

    except requests.RequestException as e:
        app.logger.exception("A network-related error occurred")
        return jsonify({'error': 'Internal server error'}), 500
    except Exception as e:
        app.logger.exception("An unexpected error occurred")
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route('/generate_map')
def generate_map():
    # Here, you would retrieve your API key from an environment variable
    api_key = os.environ.get('GOOGLE_MAPS_EMBED_API_KEY')

    # Ensure you got an API key back
    if not api_key:
        return jsonify(error='API Key not found'), 500

    # Get the full address from the query parameters
    full_address = request.args.get('address', '')

    # Perform cleaning logic and encode the address
    cleaned_address = full_address.replace("TEST PROPERTY, ", "")
    encoded_address = urllib.parse.quote(cleaned_address)  # Using 'urllib.parse.quote' to encode the address

    # Construct the Google Maps embed URL
    embed_url = f"https://www.google.com/maps/embed/v1/place?key={api_key}&q={encoded_address}"

    # Return the embed URL in JSON format
    return jsonify({'embed_url': embed_url})


@app.route('/')
def home():
    eigroup_token = os.getenv('EIGROUP_TOKEN')
    return render_template('home.html', eigroup_token=eigroup_token)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/current_lots')
def current_lots():
    return render_template('current_lots.html')

@app.route('/available_lots')
def available_lots():
    return render_template('available_lots.html')

@app.route('/bidder_registration')
def bidder_registration():
    return render_template('bidder_registration.html')

@app.route('/private_sales')
def private_sales():
    return render_template('private_sales.html')

@app.route('/future_auctions_dates')
def future_auctions_dates():
    return render_template('future_auctions_dates.html')

@app.route('/previous_auctions')
def previous_auctions():
    return render_template('previous_auctions.html')

@app.route('/free_valuation')
def free_valuation():
    return render_template('free_valuation.html')

@app.route('/auction_finance')
def auction_finance():
    return render_template('auction_finance.html')

@app.route('/auction_buying_guide')
def auction_buying_guide():
    return render_template('auction_buying_guide.html')

@app.route('/auction_selling_guide')
def auction_selling_guide():
    return render_template('auction_selling_guide.html')

@app.route('/benefits_of_auctions')
def benefits_of_auctions():
    return render_template('benefits_of_auctions.html')

@app.route('/frequently_asked_questions')
def frequently_asked_questions():
    return render_template('frequently_asked_questions.html')

@app.route('/news_and_blogs')
def news_and_blogs():
    return render_template('blogs.html')

@app.route('/blog_1')
def blog_1():
    return render_template('blog_1.html')

@app.route('/blog_2')
def blog_2():
    return render_template('blog_2.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy_policy.html')

@app.route('/complaint_procedure')
def complaint_procedure():
    return render_template('complaint_procedure.html')

@app.route('/valuation')
def valuation():
    return render_template('valuation.html')

@app.route('/error')
def error():
    return render_template('error.html')

@app.route('/404')
def erroring():
    return render_template('404.html')

# @app.route('/bbs')
# def bbs():
#     return render_template('BBS.html')


## EMAIL SUB FORM ROUTING ##

@app.route('/submit-subscription', methods=['POST'])
def submit_subscription():
    try:
        email = request.form.get('email')

        # You may want to verify or record the email address, such as adding it to a mailing list
        # For this example, we'll just send a confirmation message

        msg = Message(
            "Subscription Confirmation",  # Subject line
            sender=['MAIL_USERNAME'],  # Your email registered with the mail server
            recipients=[email]  # Email from the form
        )
        msg.body = "You have successfully subscribed to our mailing list."

        mail.send(msg)

        return jsonify(success=True)
    except Exception as e:
        print(e)  # For debugging purposes, always log your errors
        return jsonify(success=False, error=str(e))
    

## LOGIC FOR CONTACT FORMS ##

@app.route('/submit-form', methods=['POST'])
def submit_form():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')

        msg = Message(
            "New Contact message from {}".format(name),
            sender=email,
            recipients=['info@swiftpropertyauctions.co.uk']
        )
        msg.body = "From: {}\nEmail: {}\nSubject: {}\n\n{}".format(name, email, subject, message)

        mail.send(msg)

        return jsonify(success=True)
    except Exception as e:
        app.logger.error(f"An error occurred: {e}")
        return jsonify(success=False, error=str(e)), 500

@app.route('/submit-freeval-form', methods=['POST'])
def submit_freeval_form():
    try:
        # Collect form data
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        town = request.form.get('town', '').strip()
        postcode = request.parent.get('postcode', '').strip()
        property_type = request.form.get('propertyType', '').strip()
        further_information = request.form.get('furtherInformation', '').strip()

        # Validate required fields
        if not (name and email and property_type):
            return jsonify(success=False, error="Missing required fields"), 400

        # Email validation (simple pattern)
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify(success=False, error="Invalid email format"), 400

        # Create and configure the message
        msg = Message(
            f"New Free Valuation Request from {name}",
            sender='your-email@domain.com',  # Use your server email
            recipients=['info@swiftpropertyauctions.co.uk']
        )
        
        # Format the message body
        msg.body = (
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Phone: {phone}\n"
            f"Address: {address}\n"
            f"Town: {town}\n"
            f"Postcode: {postcode}\n"
            f"Property Type: {property_type}\n"
            f"Further Information:\n{further_information}"
        )

        # Send the message
        mail.send(msg)

        return jsonify(success=True)
    except Exception as e:
        # Log the exception
        app.logger.error(f"An error occurred: {e}")

        # Return error response
        return jsonify(success=False, error=str(e)), 500
    
@app.route('/submit-privsales-form', methods=['POST'])
def submit_privsales_form():
    try:
        # Retrieve fields from the form
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        budget = request.form.get('budget')
        message = request.form.get('message')

        # Format the budget as currency manually
        budget_currency = "£{:,.2f}".format(float(budget))

        # Construct the email message
        msg = Message(
            "New Private Treaty message from {}".format(name),
            sender=email,
            recipients=['info@swiftpropertyauctions.co.uk']  # Replace with your email address
        )

        # Modify the email body based on the new fields
        msg.body = "From: {}\nEmail: {}\nPhone: {}\nBudget: {}\n\n{}".format(name, email, phone, budget_currency, message)

        # Send the email
        mail.send(msg)

        return jsonify(success=True)
    except Exception as e:
        app.logger.error(f"An error occurred: {e}")
        return jsonify(success=False, error=str(e)), 500
    
@app.route('/submit-enquiry-form', methods=['POST'])
def submit_enquiry_form():
    try:
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        telephone = request.form.get('telephone')
        message = request.form.get('message')
        property_address = request.form.get('property_address')
        
        # Construct full name from first and last names
        full_name = f"{first_name} {last_name}"

        msg = Message(
            "New Enquiry message from {}".format(full_name),
            sender=email,
            recipients=['info@swiftpropertyauctions.co.uk']
        )
        msg.body = "From: {}\nEmail: {}\nTelephone: {}\nProperty Address/Name: {}\n\n{}".format(full_name, email, telephone, property_address, message)

        mail.send(msg)

        return jsonify(success=True)
    except Exception as e:
        app.logger.error(f"An error occurred: {e}")
        return jsonify(success=False, error=str(e)), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)  # Start your Flask application