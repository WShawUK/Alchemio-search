import sys
import logging
import pymysql
import json

# rds settings
rds_host = '' # hidden for security
user_name = '' # hidden for security
password = '' # hidden for security
db_name = '' # hidden for security

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# create the database connection outside of the handler to allow connections to be re-used by subsequent function invocations.
try:
    conn = pymysql.connect(host=rds_host, user=user_name, passwd=password, db=db_name, connect_timeout=5)
except pymysql.MySQLError as e:
    logger.error("ERROR: Unexpected error: Could not connect to MySQL instance.")
    logger.error(e)
    sys.exit()

logger.info("SUCCESS: Connection to RDS MySQL instance succeeded")


def lambda_handler(event, context):
    with conn.cursor() as cur:
        # cur.execute("CREATE DATABASE alchemio")

        # cur.execute("DROP TABLE recipes")
        # conn.commit()
        # cur.execute("DROP TABLE comments")
        # conn.commit()

        # cur.execute(
        #     "CREATE TABLE IF NOT EXISTS recipes (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), ingredients VARCHAR(5000), ingredients_count INT, instructions VARCHAR(5000), instructions_count INT, tags VARCHAR(100), time_submitted VARCHAR(20), username VARCHAR(50), upvotes INT)")
        # conn.commit()
        # cur.execute(
        #     'CREATE TABLE IF NOT EXISTS comments (id INT AUTO_INCREMENT PRIMARY KEY, recipe_id INT, comment_text VARCHAR(2000), time_submitted VARCHAR(20), username VARCHAR(50))')
        # conn.commit()

        event_body = json.loads(event['body'])

        if event_body['type'] == 'recipe':  # code for posting recipe
            recipe_name = event_body['recipeName']
            recipe_ingredients = event_body['ingredients']
            recipe_ingredients_count = event_body['ingredientsCount']
            recipe_instructions = event_body['instructions']
            recipe_instructions_count = event_body['instructionsCount']
            recipe_tags = event_body['tags']
            recipe_time_submitted = event_body['timeSubmitted']
            recipe_username = event_body['username']
            recipe_upvotes = event_body['upvotes']
            cur.execute(
                "INSERT INTO recipes (name, ingredients, ingredients_count, instructions, instructions_count, tags, time_submitted, username, upvotes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (recipe_name, recipe_ingredients, recipe_ingredients_count, recipe_instructions,
                 recipe_instructions_count, recipe_tags, recipe_time_submitted, recipe_username, recipe_upvotes))
            conn.commit()

            return {
                'statusCode': 200,
                'body': json.dumps(f'recipe: {recipe_name} submitted')
            }

        if event_body['type'] == 'comment':
            comment_recipeID = event_body['recipeID']
            comment_text = event_body['commentText']
            comment_username = event_body['username']
            comment_time_submitted = event_body['timeSubmitted']
            cur.execute(
                "INSERT INTO comments (recipe_id, comment_text, time_submitted, username) VALUES (%s, %s, %s, %s)",
                (comment_recipeID, comment_text, comment_username, comment_time_submitted))
            conn.commit()

            cur.execute("SELECT * FROM comments")
            return {
                'statusCode': 200,
                'body': json.dumps(f'comment on recipeId {comment_recipeID} succeeded')
            }

        if event_body['type'] == 'search':  # code for searching for recipes
            #  construct SQL input
            SQL_search_string = "SELECT DISTINCT * FROM recipes "
            SQL_search_list = []

            if event_body['searchTerms']:
                search_terms = event_body['searchTerms']

                SQL_search_string += "WHERE name LIKE %s OR tags LIKE %s OR ingredients LIKE %s OR instructions LIKE %s OR username LIKE %s "
                SQL_search_list.append(f"%{search_terms[0]}%")
                SQL_search_list.append(f"%{search_terms[0]}%")
                SQL_search_list.append(f"%{search_terms[0]}%")
                SQL_search_list.append(f"%{search_terms[0]}%")
                SQL_search_list.append(f"%{search_terms[0]}%")

                for search_term in search_terms[1:]:
                    SQL_search_string += "OR name LIKE %s OR tags LIKE %s OR ingredients LIKE %s OR instructions LIKE %s OR username LIKE %s "
                    SQL_search_list.append(f"%{search_term}%")
                    SQL_search_list.append(f"%{search_term}%")
                    SQL_search_list.append(f"%{search_term}%")
                    SQL_search_list.append(f"%{search_term}%")
                    SQL_search_list.append(f"%{search_term}%")

            search_sort = event_body['sort']
            SQL_search_string += f"ORDER BY {search_sort} "

            # search_sort_direction = ('DESC' if event_body['sortDirection'] == 'descending' else 'ASC')
            search_sort_direction = event_body['sortDirection']
            SQL_search_string += f'{search_sort_direction} '

            search_limit = event_body['numberToReceive']
            SQL_search_string += 'LIMIT %s'
            SQL_search_list.append(search_limit)

            # # make query
            cur.execute(SQL_search_string, SQL_search_list)
            recipes_to_return = cur.fetchall()

            if not recipes_to_return:  # if search finds nothing
                return {
                    'statusCode': 200,
                    'body': json.dumps('search returned nothing')
                }

            # get comments of those
            recipe_ids_string = f"({', '.join(str(recipe[0]) for recipe in recipes_to_return)})"
            cur.execute(f"SELECT * FROM comments WHERE recipe_id IN {recipe_ids_string}")
            return {  # TODO
                'statusCode': 200,
                'body': [recipes_to_return, cur.fetchall()]
            }

        if event_body['type'] == 'upvote':
            upvote_recipeId = event_body['recipeId']
            upvote_direction = event_body['direction']
            cur.execute(f"UPDATE recipes SET upvotes = upvotes {upvote_direction} 1 WHERE id = {upvote_recipeId}")
            conn.commit()
            return {
                'statusCode': 200,
                'body': json.dumps('upvote procedure successful')
            }

        # cur.execute("SELECT * FROM recipes")
        # return {
        #     'statusCode': 200,
        #     'body': json.dumps(cur.fetchall())
        # }
