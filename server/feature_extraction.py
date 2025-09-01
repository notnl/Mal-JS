import os
import re
import math
import warnings
import numpy as np
import pandas as pd
from tqdm import tqdm
from collections import Counter, defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer


def entropy(s):
    p, lns = Counter(s), float(len(s))
    return -sum(count / lns * math.log(count / lns, 2) for count in p.values())


def natural_language_extraction(df: pd.DataFrame):
    df['js_length'] = df.js.apply(lambda x: len(x))
    df['num_spaces'] = df.js.apply(lambda x: x.count(' '))

    df['num_parenthesis'] = df.js.apply(lambda x: (x.count('(') + x.count(')')))
    df['num_slash'] = df.js.apply(lambda x: x.count('/'))
    df['num_plus'] = df.js.apply(lambda x: x.count('+'))
    df['num_point'] = df.js.apply(lambda x: x.count('.'))
    df['num_comma'] = df.js.apply(lambda x: x.count(','))
    df['num_semicolon'] = df.js.apply(lambda x: x.count(';'))
    df['num_alpha'] = df.js.apply(lambda x: len(re.findall(re.compile(r"\w"), x)))
    df['num_numeric'] = df.js.apply(lambda x: len(re.findall(re.compile(r"[0-9]"), x)))

    df['ratio_spaces'] = df['num_spaces'] / df['js_length']
    df['ratio_alpha'] = df['num_alpha'] / df['js_length']
    df['ratio_numeric'] = df['num_numeric'] / df['js_length']
    df['ratio_parenthesis'] = df['num_parenthesis'] / df['js_length']
    df['ratio_slash'] = df['num_slash'] / df['js_length']
    df['ratio_plus'] = df['num_plus'] / df['js_length']
    df['ratio_point'] = df['num_point'] / df['js_length']
    df['ratio_comma'] = df['num_comma'] / df['js_length']
    df['ratio_semicolon'] = df['num_semicolon'] / df['js_length']

    # String Operation: substring(), charAt(), split(), concat(), slice(), substr()
    df['entropy'] = df.js.apply(lambda x: entropy(x))

    df['num_string_oper'] = df.js.apply(
        lambda x: x.count('substring') + x.count('charAt') + x.count('split') + x.count('concat') + x.count(
            'slice') + x.count('substr'))

    df['ratio_num_string_oper'] = df['num_string_oper'] / df['js_length']

    # Encoding Operation: escape(), unescape(), string(), fromCharCode()

    df['num_encoding_oper'] = df.js.apply(
        lambda x: x.count('escape') + x.count('unescape') + x.count('string') + x.count('fromCharCode'))

    df['ratio_num_encoding_oper'] = df['num_encoding_oper'] / df['js_length']

    # URL Redirection: setTimeout(), location.reload(), location.replace(), document.URL(), document.location(), document.referrer()

    df['num_url_redirection'] = df.js.apply(
        lambda x: x.count('setTimeout') + x.count('location.reload') + x.count('location.replace') + x.count(
            'document.URL') + x.count('document.location') + x.count('document.referrer'))

    df['ratio_num_url_redirection'] = df['num_url_redirection'] / df['js_length']
    # Specific Behaviors: eval(), setTime(), setInterval(), ActiveXObject(), createElement(), document.write(), document.writeln(), document.replaceChildren()

    df['num_specific_func'] = df.js.apply(lambda x: x.count('eval') +
                                                    x.count('setTime') +
                                                    x.count('setInterval') +
                                                    x.count('ActiveXObject') +
                                                    x.count('createElement') +
                                                    x.count('document.write') +
                                                    x.count('document.writeln') +
                                                    x.count('document.replaceChildren'))

    df['ratio_num_specific_func'] = df['num_specific_func'] / df['js_length']
    return df


def lexical_extraction(df: pd.DataFrame):
	# Handle missing values in the current chunk
	df.fillna('', inplace=True)  # Replace NaN values with empty strings
	#remaining_columns = df.iloc[:, 4:len(df.columns)]
	vectorizer = TfidfVectorizer(sublinear_tf=True, max_df=0.5, min_df=5)
	X = np.asarray(df['js'])
	X_vectorized = vectorizer.fit_transform(X)
	feature_names = vectorizer.get_feature_names_out()
	dense = X_vectorized.todense()
	denselist = dense.tolist()
	output = pd.concat([df, pd.DataFrame(denselist, columns=feature_names)], axis=1)
	return output

def lexical_remove_extra_columns(df: pd.DataFrame, df2: pd.DataFrame):
    #This function is needed because when running lexical extraction, columns might not be the same as training dataset.
	# Get the columns of the first DataFrame ignoring the important parts
	columns_df1 = set(df.columns[4:])

	# Get the columns of the second DataFrame
	columns_df2 = set(df2.columns)

	# Find the extra columns in df1
	extra_columns_df1 = columns_df1 - columns_df2

	# Find the extra columns in df2
	extra_columns_df2 = columns_df2 - columns_df1

	# Drop the extra columns from df1 and df2 if present
	if extra_columns_df1:
		df = df.drop(extra_columns_df1, axis=1)
		return df
	else:
		df2 = df2.drop(extra_columns_df2, axis=1)
		return df2


def is_valid_syntax(code):
    try:
        esprima.parseScript(code)
        return True
    except:
        return False


def count_node_types(node, node_counts):
    #node_type = node.type
    #node_counts[node_type] += 1
	if node is not None:
		node_type = node.type
		node_counts[node_type] += 1

		for prop, value in vars(node).items():
			if isinstance(value, list):
	    			for item in value:
	    				count_node_types(item, node_counts)
			elif isinstance(value, object) and hasattr(value, 'type'):
				count_node_types(value, node_counts)


def add_node_type_counts(row):
    js_code = row['js']
    ast = esprima.parseScript(js_code)

    node_counts = defaultdict(float)
    count_node_types(ast, node_counts)

    for node_type, count in node_counts.items():
        if node_type != 'js':  # Exclude the 'js' column from counting
            row[node_type] = round(count, 1)  # Format count to 1 decimal place

    return row


def syntactic_extraction(df: pd.DataFrame):
	df_backup = df.copy();
	df['js'] = df['js'].astype(pd.StringDtype())
	df['valid_syntax'] = df['js'].apply(is_valid_syntax)
	df = df[df['valid_syntax']]
	df = df.drop('valid_syntax', axis=1)
	# Cleaning up the dataframe
	df = df.apply(add_node_type_counts, axis=1)
	df = df.fillna(0)
	if None in df.columns:
		df = df.drop(columns=[None])
	duplicate_columns = ['js_filename', 'js', 'malicious', 'obfuscated', 'valid_syntax']
	df = df.drop(duplicate_columns, axis=1, errors='ignore')
	output = pd.concat([df_backup, df], axis=1)
	return output

