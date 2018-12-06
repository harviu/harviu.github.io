import urllib.request
import re
import json


def readRawListFile(fileName):
    p = re.compile(r'(/ship_spec\.php\?ship_id=\w+).*?(United States|Japan)')
    with open(fileName, 'r',encoding='iso-8859-1') as listFile:
        text = listFile.read()
        oneMatch = p.search(text)
        start = oneMatch.end()
        shipList = []
        while oneMatch:
            start = oneMatch.end()
            # if oneMatch[0].count('Heavy'):
            if oneMatch[0].count('ship_spec.php') ==1:
                shipList.append(oneMatch[1])
            else:
                trimmed = oneMatch[0][oneMatch[0].rfind('/ship_spec.php'):]
                newMatch = p.match(trimmed)
                shipList.append(newMatch[1])
            oneMatch = p.search(text,start)
    return shipList

def fetchShips():
    '''
    read the ship list and download individual webpage.
    '''
    domain = 'https://ww2db.com'
    urlList = []
    urlList = urlList + readRawListFile('CVList')+readRawListFile('BBList')+readRawListFile('CAList')
    i = 0
    for url in urlList:
        urllib.request.urlretrieve(domain+url,".\\ships\\"+str(i))
        i= i+1

def main():
    if False:
        # change to true if want to refetch all webpages
        file_name,_ = urllib.request.urlretrieve('https://ww2db.com/ship.php?list=B',"BBList")
        file_name,_ = urllib.request.urlretrieve('https://ww2db.com/ship.php?list=A',"CVList")
        file_name,_ = urllib.request.urlretrieve('https://ww2db.com/ship.php?list=C',"CAList")
        fetchShips()
    ships=[]
    for i in range(199):
        with open("ships\\"+str(i), 'r',encoding='iso-8859-1') as shipFile:
            p = re.compile(r"<h2 itemprop='name' class='articleHeader'>.*?(?=Contributor)")
            text = shipFile.read()
        infoText = p.search(text)[0]
        p2 = re.compile(r">[^<>]+?<")
        temp = []
        info = {}
        for t in p2.finditer(infoText):
            temp.append(t[0][1:-1])
        info['name']= temp[0]
        for j in range(1,len(temp),2):
            info[temp[j]]=temp[j+1]

        info['events'] = []
        p3 = re.compile(r'''\["<div style='min-width: 180px; min-height: 50px;'>.*?\]''')
        p4 = re.compile(r', -?\d+(\.\d+)?, -?\d+(\.\d+)?(?=, -?\d*])')
        p5 = re.compile(r"Title'>[^<>]+?(?=<)")
        for location in p3.finditer(text):
            temp = p5.findall(location[0])
            geo = p4.search(location[0])[0][2:]
            for j in range(0,len(temp)):
                event = {}
                event['date'] = temp[j][7:]
                event['geometry']= geo
                info['events'].append(event)
        ships.append(info)

    with open('ships.json', 'w',encoding='utf-8') as f:
        json.dump(ships, f,ensure_ascii=False)

    

if __name__ == "__main__":
    main()



