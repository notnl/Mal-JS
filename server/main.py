from flask import Flask,request,jsonify

from flask_cors import CORS

import pickle
import feature_extraction
import pandas as pd

app = Flask(__name__)

#CORS(app, origins=["http://:80"])


model_name = 'non_obfuscated_NL_XGB.pk1' #Natural Language Extraction
with open(model_name, 'rb') as file:
    loaded_model = pickle.load(file)


@app.route("/api/generate", methods=["POST"])
def generate():
    content = request.json 
    df = pd.DataFrame({
        "js": [content['JSContent']]
    })
    df=feature_extraction.natural_language_extraction(df)

    result=loaded_model.predict(df.iloc[:,1:])

    if(result==0):

        return {"message": '0'} #NOT Malicious
    else:
        return {"message": '1'} # Malicious


